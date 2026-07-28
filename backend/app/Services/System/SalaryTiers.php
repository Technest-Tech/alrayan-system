<?php

namespace App\Services\System;

/**
 * The teacher salary ladder.
 *
 * How many hours a teacher taught in the month decides the hourly rate the
 * WHOLE month is paid at — the flat rate of the tier reached, not progressive
 * tax-style brackets. 100 taught hours land in the 86–115 tier, so the month
 * pays 100 × $3.25 = $325.00.
 *
 * Each next tier starts at its stated minimum (35.5h is still below the 36h
 * threshold; 36h reaches the next tier). Anything above the top tier stays at
 * the top rate — the ladder caps, it never stops paying.
 *
 * Rates are USD cents per taught hour, matching how every other money field in
 * the system is stored (integer minor units).
 */
class SalaryTiers
{
    public const CURRENCY = 'USD';

    /** @var array<int, array{min_hours:int, max_hours:int|null, rate_minor:int}> */
    public const LADDER = [
        ['min_hours' => 0,   'max_hours' => 35,   'rate_minor' => 250],
        ['min_hours' => 36,  'max_hours' => 60,   'rate_minor' => 275],
        ['min_hours' => 61,  'max_hours' => 85,   'rate_minor' => 300],
        ['min_hours' => 86,  'max_hours' => 115,  'rate_minor' => 325],
        ['min_hours' => 116, 'max_hours' => 150,  'rate_minor' => 350],
        ['min_hours' => 151, 'max_hours' => 175,  'rate_minor' => 375],
        ['min_hours' => 176, 'max_hours' => 210,  'rate_minor' => 400],
    ];

    /**
     * The ladder as tier rows with their index, ready for the API/UI.
     *
     * @param array<int,array>|null $override a ladder snapshot (payroll audit trail)
     * @return array<int, array{index:int, min_hours:int, max_hours:int|null, rate_minor:int, currency:string}>
     */
    public function ladder(?array $override = null): array
    {
        $rows = $override ?: self::LADDER;
        $out  = [];

        foreach (array_values($rows) as $i => $row) {
            $out[] = [
                'index'      => $i,
                'min_hours'  => (int) $row['min_hours'],
                'max_hours'  => isset($row['max_hours']) ? (int) $row['max_hours'] : null,
                'rate_minor' => (int) $row['rate_minor'],
                'currency'   => self::CURRENCY,
            ];
        }

        return $out;
    }

    /**
     * The tier a month of `$hours` is paid at. Hours beyond the top tier's
     * ceiling stay on the top tier (rate cap).
     *
     * @return array{index:int, min_hours:int, max_hours:int|null, rate_minor:int, currency:string}
     */
    public function tierForHours(float $hours, ?array $ladder = null): array
    {
        $tiers = $this->ladder($ladder);

        foreach ($tiers as $index => $tier) {
            $next = $tiers[$index + 1] ?? null;
            if ($next === null || $hours < $next['min_hours']) {
                return $tier;
            }
        }

        return end($tiers);
    }

    /** USD cents per hour for a month of `$hours`. */
    public function rateMinor(float $hours, ?array $ladder = null): int
    {
        return $this->tierForHours($hours, $ladder)['rate_minor'];
    }

    /** What a month of `$hours` pays, in USD cents: every hour at the tier rate. */
    public function salaryMinor(float $hours, ?array $ladder = null): int
    {
        return (int) round($hours * $this->rateMinor($hours, $ladder));
    }

    /**
     * Where a teacher stands on the ladder right now — the card the teacher
     * sees in their portal and the admin sees per teacher.
     *
     * @return array{
     *   hours:float, currency:string, tier:array, next_tier:array|null,
     *   hours_to_next:float, progress_pct:float,
     *   salary_minor:int, next_tier_salary_minor:int|null, rate_minor:int
     * }
     */
    public function progress(float $hours, ?array $ladder = null): array
    {
        $tiers = $this->ladder($ladder);
        $tier  = $this->tierForHours($hours, $ladder);
        $next  = $tiers[$tier['index'] + 1] ?? null;

        // Progress runs from this tier's floor to the next tier's floor, so the
        // bar fills exactly as the teacher approaches the next rate.
        $floor   = (float) $tier['min_hours'];
        $ceiling = $next ? (float) $next['min_hours'] : max((float) $tier['min_hours'], $hours);
        $span    = max($ceiling - $floor, 0.01);
        $pct     = $next ? max(0.0, min(100.0, (($hours - $floor) / $span) * 100)) : 100.0;

        return [
            'hours'                  => round($hours, 2),
            'currency'               => self::CURRENCY,
            'tier'                   => $tier,
            'next_tier'              => $next,
            'hours_to_next'          => $next ? round(max(0.0, $next['min_hours'] - $hours), 2) : 0.0,
            'progress_pct'           => round($pct, 1),
            'rate_minor'             => $tier['rate_minor'],
            'salary_minor'           => $this->salaryMinor($hours, $ladder),
            // What the same month would pay once the next tier is reached — the
            // "keep going" number: the next tier's floor hours at its own rate.
            'next_tier_salary_minor' => $next ? (int) round($next['min_hours'] * $next['rate_minor']) : null,
        ];
    }
}
