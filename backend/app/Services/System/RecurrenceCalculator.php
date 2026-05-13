<?php

namespace App\Services\System;

use App\Models\System\SchedulePattern;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class Occurrence
{
    public function __construct(
        public readonly Carbon $startUtc,
        public readonly Carbon $endUtc,
    ) {}
}

class RecurrenceCalculator
{
    public function __construct(private TimezoneResolver $tz) {}

    /**
     * Expand a pattern into concrete UTC occurrences within [$from, $to].
     * Handles DST: each occurrence is resolved independently in the pattern's timezone.
     *
     * @return Occurrence[]
     */
    public function expand(SchedulePattern $pattern, Carbon $from, Carbon $to): array
    {
        $occurrences = [];
        $tz          = $pattern->timezone;
        $dayOfWeek   = $pattern->day_of_week; // 0=Sun … 6=Sat
        $startTime   = $pattern->start_time;  // e.g. "18:00:00"
        $durationMin = $pattern->duration_min;
        $validFrom   = Carbon::parse($pattern->valid_from, $tz)->startOfDay();
        $validTo     = $pattern->valid_to ? Carbon::parse($pattern->valid_to, $tz)->endOfDay() : null;

        // Walk day-by-day through the window
        $cursor = $from->copy()->setTimezone($tz)->startOfDay();
        $end    = $to->copy()->setTimezone($tz)->endOfDay();

        while ($cursor->lte($end)) {
            // Carbon uses 0=Sun…6=Sat via ->dayOfWeek
            if ($cursor->dayOfWeek === $dayOfWeek) {
                // Check within pattern validity
                if ($cursor->lt($validFrom)) {
                    $cursor->addDay();
                    continue;
                }
                if ($validTo && $cursor->gt($validTo)) {
                    break;
                }

                // Build the local datetime and convert to UTC (DST-safe)
                [$h, $m] = explode(':', $startTime);
                $localStart = $cursor->copy()->setHour((int) $h)->setMinute((int) $m)->setSecond(0);
                $startUtc   = $localStart->copy()->utc();
                $endUtc     = $startUtc->copy()->addMinutes($durationMin);

                // Only include if the occurrence overlaps the requested window
                if ($startUtc->gte($from) && $startUtc->lt($to)) {
                    $occurrences[] = new Occurrence($startUtc, $endUtc);
                }
            }
            $cursor->addDay();
        }

        return $occurrences;
    }
}
