<?php

namespace App\Services\System;

use App\Models\System\Teacher;
use Carbon\Carbon;

class TeacherAvailabilityResolver
{
    /**
     * Is the teacher available at the given UTC datetime for N minutes?
     */
    public function isAvailable(Teacher $teacher, Carbon $utcStart, int $durationMinutes): bool
    {
        if (!$teacher->relationLoaded('availability')) {
            $teacher->load('availability');
        }

        foreach ($teacher->availability as $slot) {
            $tz         = $slot->timezone ?? 'Africa/Cairo';
            $local      = $utcStart->copy()->setTimezone($tz);
            $dayOfWeek  = (int) $local->dayOfWeek; // 0=Sun

            if ($dayOfWeek !== $slot->day_of_week) continue;

            $slotStart = Carbon::parse($local->format('Y-m-d') . ' ' . $slot->start_time, $tz);
            $slotEnd   = Carbon::parse($local->format('Y-m-d') . ' ' . $slot->end_time, $tz);
            $sessionEnd = $local->copy()->addMinutes($durationMinutes);

            if ($local->greaterThanOrEqualTo($slotStart) && $sessionEnd->lessThanOrEqualTo($slotEnd)) {
                return true;
            }
        }

        return false;
    }
}
