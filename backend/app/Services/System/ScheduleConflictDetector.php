<?php

namespace App\Services\System;

use App\Models\System\Session;
use App\Models\System\TeacherLeave;
use Carbon\Carbon;

class Conflict
{
    public function __construct(
        public readonly string $type,
        public readonly mixed  $related,
    ) {}
}

class ScheduleConflictDetector
{
    public function __construct(private TeacherAvailabilityResolver $availability) {}

    /**
     * Returns Conflict[] for (teacher, startUtc, endUtc).
     * Optionally excludes a session id (for reschedule preview).
     *
     * @return Conflict[]
     */
    public function check(int $teacherId, Carbon $startUtc, Carbon $endUtc, ?int $excludeSessionId = null): array
    {
        $out = [];

        // 1. Teacher double-booking
        $clashes = Session::where('teacher_id', $teacherId)
            ->where('status', 'scheduled')
            ->when($excludeSessionId, fn ($q) => $q->where('id', '!=', $excludeSessionId))
            ->where(function ($q) use ($startUtc, $endUtc) {
                $q->whereBetween('scheduled_start', [$startUtc, $endUtc->copy()->subSecond()])
                  ->orWhereBetween('scheduled_end', [$startUtc->copy()->addSecond(), $endUtc])
                  ->orWhere(function ($q) use ($startUtc, $endUtc) {
                      $q->where('scheduled_start', '<=', $startUtc)
                        ->where('scheduled_end', '>=', $endUtc);
                  });
            })->get();

        foreach ($clashes as $c) {
            $out[] = new Conflict('teacher_double_booking', $c);
        }

        // 2. Teacher on approved leave
        $leave = TeacherLeave::where('teacher_id', $teacherId)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $startUtc->toDateString())
            ->whereDate('end_date', '>=', $endUtc->toDateString())
            ->first();

        if ($leave) {
            $out[] = new Conflict('teacher_on_leave', $leave);
        }

        // 3. Outside availability
        $durationMin = $endUtc->diffInMinutes($startUtc);
        if (!$this->availability->isAvailable($teacherId, $startUtc, $durationMin)) {
            $out[] = new Conflict('teacher_unavailable', null);
        }

        return $out;
    }

    /**
     * Scan all upcoming scheduled sessions for conflicts.
     *
     * @return array<array{session: Session, conflicts: Conflict[]}>
     */
    public function detectAll(): array
    {
        $results = [];

        Session::where('status', 'scheduled')
            ->where('scheduled_start', '>', now())
            ->with(['teacher', 'student'])
            ->cursor()
            ->each(function (Session $s) use (&$results) {
                $conflicts = $this->check(
                    teacherId:        $s->teacher_id,
                    startUtc:         $s->scheduled_start,
                    endUtc:           $s->scheduled_end,
                    excludeSessionId: $s->id,
                );

                if (!empty($conflicts)) {
                    $results[] = ['session' => $s, 'conflicts' => $conflicts];
                }
            });

        return $results;
    }
}
