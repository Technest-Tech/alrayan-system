<?php

namespace App\Services\System;

use App\Models\System\Lesson;
use App\Models\System\LessonSchedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LessonScheduleService
{
    const HORIZON_DAYS = 90;

    /** Generate scheduled lessons for a schedule (idempotent — skips existing). */
    public function generateLessons(LessonSchedule $schedule): void
    {
        $schedule->loadMissing('slots', 'student');
        $student = $schedule->student;
        $pkgSvc  = app(PackageService::class);

        DB::transaction(function () use ($schedule, $student, $pkgSvc) {
            $dates = $this->getOccurrenceDates($schedule);

            foreach ($dates as $date) {
                foreach ($schedule->slots as $slot) {
                    $scheduledAt = $date->copy()->setTimeFromTimeString($slot->start_time);

                    $exists = Lesson::where('schedule_id', $schedule->id)
                        ->where('scheduled_at', $scheduledAt)
                        ->withTrashed()
                        ->exists();

                    if ($exists) continue;

                    $package = $pkgSvc->resolvePackageForLesson($student, $scheduledAt);

                    Lesson::create([
                        'package_id'       => $package->id,
                        'schedule_id'      => $schedule->id,
                        'teacher_id'       => $schedule->teacher_id,
                        'student_id'       => $schedule->student_id,
                        'subject_id'       => $schedule->subject_id,
                        'scheduled_at'     => $scheduledAt,
                        'duration_minutes' => $slot->duration_minutes,
                        'status'           => 'scheduled',
                        'added_by'         => auth()->id(),
                    ]);

                    $pkgSvc->recalculateSessionNumbers($package->id);
                }
            }
        });
    }

    /** Get all occurrence dates for a schedule within the horizon. */
    private function getOccurrenceDates(LessonSchedule $schedule): array
    {
        $start      = Carbon::parse($schedule->start_date)->startOfDay();
        $horizon    = Carbon::now()->addDays(self::HORIZON_DAYS)->endOfDay();
        $daysOfWeek = $schedule->slots->pluck('day_of_week')->unique()->values()->toArray();
        $dates      = [];

        $intervalDays = match ($schedule->recurrence) {
            'weekly'        => 7,
            'biweekly'      => 14,
            'every_4_weeks' => 28,
            default         => null, // none or custom
        };

        foreach ($daysOfWeek as $dow) {
            // Find first occurrence of this day on/after start_date
            $date      = $start->copy();
            $daysToAdd = ($dow - $date->dayOfWeek + 7) % 7;
            $date->addDays($daysToAdd);

            if ($intervalDays === null) {
                // 'none': just one occurrence
                if ($date->lte($horizon)) {
                    $dates[] = $date->copy();
                }
            } else {
                while ($date->lte($horizon)) {
                    $dates[] = $date->copy();
                    $date->addDays($intervalDays);
                }
            }
        }

        return $dates;
    }
}
