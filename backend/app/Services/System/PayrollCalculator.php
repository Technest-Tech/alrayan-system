<?php

namespace App\Services\System;

use App\Models\System\Session;
use App\Models\System\Teacher;
use App\Services\System\Dto\PayrollComputation;
use Carbon\Carbon;

class PayrollCalculator
{
    public function calculate(Teacher $teacher, Carbon $start, Carbon $end, ?array $rateSnapshot = null): PayrollComputation
    {
        $rates = $rateSnapshot ?? [
            30 => (int) $teacher->per_minute_rate_30,
            45 => (int) $teacher->per_minute_rate_45,
            60 => (int) $teacher->per_minute_rate_60,
        ];

        $sessions = Session::query()
            ->where('teacher_id', $teacher->id)
            ->where('status', 'attended')
            ->whereBetween('scheduled_start', [$start, $end])
            ->get();

        $totalSessions = $sessions->count();
        $byDuration    = [30 => 0, 45 => 0, 60 => 0];
        $base          = 0;

        foreach ($sessions as $s) {
            $d = $this->snapDuration($s->duration_min);
            $byDuration[$d] = ($byDuration[$d] ?? 0) + $s->duration_min;
            $base += $s->duration_min * ($rates[$d] ?? 0);
        }

        $totalMinutes = array_sum($byDuration);

        return new PayrollComputation(
            totalSessions:       $totalSessions,
            totalMinutes:        $totalMinutes,
            breakdownByDuration: $byDuration,
            baseSalaryMinor:     $base,
            rateSnapshot:        $rates,
        );
    }

    private function snapDuration(int $minutes): int
    {
        if ($minutes <= 37) return 30;
        if ($minutes <= 52) return 45;
        return 60;
    }
}
