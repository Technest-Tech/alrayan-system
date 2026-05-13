<?php

namespace App\Services\System;

use App\Models\System\SchedulePattern;
use App\Models\System\Session;
use App\Models\System\Student;
use Illuminate\Support\Collection;

class SessionMaterializer
{
    public function __construct(private RecurrenceCalculator $rec) {}

    /**
     * Idempotent. For each active pattern of $student that intersects
     * [now, now+$days], emit a sys_sessions row if not already present.
     * Returns the list of newly-created Session models.
     */
    public function materialize(Student $student, int $days = 14): Collection
    {
        $now     = now();
        $end     = $now->copy()->addDays($days);
        $created = collect();

        $patterns = SchedulePattern::query()
            ->where('student_id', $student->id)
            ->whereNull('deleted_at')
            ->where('valid_from', '<=', $end->toDateString())
            ->where(fn ($q) => $q->whereNull('valid_to')->orWhere('valid_to', '>=', $now->toDateString()))
            ->get();

        foreach ($patterns as $pattern) {
            foreach ($this->rec->expand($pattern, $now, $end) as $occurrence) {
                $exists = Session::where('schedule_pattern_id', $pattern->id)
                    ->where('scheduled_start', $occurrence->startUtc)
                    ->exists();

                if ($exists) {
                    continue;
                }

                $session = Session::create([
                    'student_id'          => $student->id,
                    'teacher_id'          => $pattern->teacher_id,
                    'schedule_pattern_id' => $pattern->id,
                    'scheduled_start'     => $occurrence->startUtc,
                    'scheduled_end'       => $occurrence->endUtc,
                    'duration_min'        => $pattern->duration_min,
                    'status'              => 'scheduled',
                ]);

                $created->push($session);
            }
        }

        return $created;
    }

    /**
     * Materialize for all active students.
     */
    public function materializeAll(int $days = 14): Collection
    {
        $all = collect();
        Student::where('status', 'active')->cursor()->each(function (Student $s) use ($days, &$all) {
            $all = $all->merge($this->materialize($s, $days));
        });
        return $all;
    }
}
