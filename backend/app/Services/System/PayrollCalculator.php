<?php

namespace App\Services\System;

use App\Models\System\Teacher;
use App\Services\System\Dto\PayrollComputation;
use Carbon\Carbon;

/**
 * Salary base = every taught hour priced at the teacher's hour-tier rate for
 * the month (see SalaryTiers: the flat rate of the tier the total hours reach).
 * Lessons come from `sys_lessons` (see LessonMetrics) — the same source as the
 * Race, the teacher dashboard and Analytics, so payroll can never disagree.
 *
 * Payrolls generated before the ladder carry a per-minute rate snapshot
 * (`[30 => …, 45 => …, 60 => …]`); recalculating one keeps the old per-minute
 * formula so history can't silently change model underneath an approved slip.
 */
class PayrollCalculator
{
    public function __construct(
        private readonly LessonMetrics $metrics,
        private readonly SalaryTiers $tiers,
    ) {}

    public function calculate(Teacher $teacher, Carbon $start, Carbon $end, ?array $rateSnapshot = null): PayrollComputation
    {
        $row = $this->metrics->bucketedByTeacher($start, $end)->get($teacher->id);

        $byDuration = [
            30 => (int) ($row->min30 ?? 0),
            45 => (int) ($row->min45 ?? 0),
            60 => (int) ($row->min60 ?? 0),
        ];

        $minutes  = array_sum($byDuration);
        $lessons  = (int) ($row->lessons ?? 0);
        $hours    = round($minutes / 60, 2);

        if ($rateSnapshot && self::isLegacyPerMinuteSnapshot($rateSnapshot)) {
            $base = 0;
            foreach ($byDuration as $bucket => $bucketMinutes) {
                $base += $bucketMinutes * (int) ($rateSnapshot[$bucket] ?? $rateSnapshot[(string) $bucket] ?? 0);
            }

            // Before the USD ladder, payroll amounts were presented and paid in
            // the system base currency (EGP by default). Keep that historical
            // contract when a legacy snapshot is recalculated.
            $legacyCurrency = isset($rateSnapshot['currency']) && is_string($rateSnapshot['currency'])
                ? strtoupper($rateSnapshot['currency'])
                : config('system.default_base_currency', 'EGP');

            return new PayrollComputation(
                totalSessions:       $lessons,
                totalMinutes:        $minutes,
                breakdownByDuration: $byDuration,
                baseSalaryMinor:     $base,
                rateSnapshot:        $rateSnapshot,
                totalHours:          $hours,
                hourlyRateMinor:     $minutes > 0 ? (int) round($base / ($minutes / 60)) : 0,
                currency:            $legacyCurrency,
            );
        }

        // The ladder in force when the payroll was first generated wins, so an
        // approved month stays reproducible even after the rates are revised.
        $ladder = $rateSnapshot['ladder'] ?? null;
        $tier   = $this->tiers->tierForHours($hours, $ladder);
        $base   = $this->tiers->salaryMinor($hours, $ladder);

        return new PayrollComputation(
            totalSessions:       $lessons,
            totalMinutes:        $minutes,
            breakdownByDuration: $byDuration,
            baseSalaryMinor:     $base,
            rateSnapshot:        [
                'mode'              => 'hour_tier',
                'currency'          => SalaryTiers::CURRENCY,
                'hours'             => $hours,
                'tier_index'        => $tier['index'],
                'tier_min_hours'    => $tier['min_hours'],
                'tier_max_hours'    => $tier['max_hours'],
                'hourly_rate_minor' => $tier['rate_minor'],
                'ladder'            => $this->tiers->ladder($ladder),
            ],
            totalHours:          $hours,
            hourlyRateMinor:     $tier['rate_minor'],
            currency:            SalaryTiers::CURRENCY,
            tierIndex:           $tier['index'],
        );
    }

    /** Pre-ladder snapshots are a bucket => per-minute-rate map keyed by 30/45/60. */
    public static function isLegacyPerMinuteSnapshot(array $snapshot): bool
    {
        if (($snapshot['mode'] ?? null) === 'hour_tier') return false;

        return isset($snapshot[30]) || isset($snapshot['30'])
            || isset($snapshot[45]) || isset($snapshot['45'])
            || isset($snapshot[60]) || isset($snapshot['60']);
    }
}
