<?php

namespace App\Support\System;

/**
 * The tunable side of the Profitability report: the percentage lines skimmed off
 * each teacher's gross margin (advertising, charity, anything else the owners
 * decide) and how many ways the surviving net profit is split.
 *
 * Ported from the old academy system, where these lived as editable percentage
 * boxes in the table header. They are business constants, not per-request input,
 * so they persist in `sys_settings` and every viewer sees the same figures.
 */
class ProfitabilityConfig
{
    public const DEDUCTIONS_KEY = 'profitability.deductions';
    public const PARTNERS_KEY   = 'profitability.partner_count';
    public const CURRENCY_KEY   = 'profitability.report_currency';

    /** At most this many percentage lines — the table header has room for three. */
    public const MAX_DEDUCTIONS = 3;

    /** @var array<int, array{key:string, label:string, percent:float}> */
    public const DEFAULT_DEDUCTIONS = [
        ['key' => 'ads',     'label' => 'Ads',     'percent' => 33.0],
        ['key' => 'charity', 'label' => 'Charity', 'percent' => 6.7],
        ['key' => 'other',   'label' => 'Other',   'percent' => 0.0],
    ];

    /**
     * @return array<int, array{key:string, label:string, percent:float}>
     */
    public static function deductions(): array
    {
        $raw = Setting::get(self::DEDUCTIONS_KEY);
        if (! is_string($raw) || $raw === '') return self::DEFAULT_DEDUCTIONS;

        $decoded = json_decode($raw, true);
        if (! is_array($decoded) || $decoded === []) return self::DEFAULT_DEDUCTIONS;

        return self::normalize($decoded);
    }

    /**
     * Coerce arbitrary stored/posted rows into the shape the report expects:
     * a non-empty key, a trimmed label and a percent clamped to 0–100.
     *
     * @param  array<int, mixed> $rows
     * @return array<int, array{key:string, label:string, percent:float}>
     */
    public static function normalize(array $rows): array
    {
        $out = [];

        foreach (array_values($rows) as $i => $row) {
            if (! is_array($row)) continue;

            $key   = isset($row['key']) ? trim((string) $row['key']) : '';
            $label = isset($row['label']) ? trim((string) $row['label']) : '';
            $pct   = isset($row['percent']) ? (float) $row['percent'] : 0.0;

            $out[] = [
                'key'     => $key !== '' ? $key : 'line_' . ($i + 1),
                'label'   => $label !== '' ? $label : 'Line ' . ($i + 1),
                'percent' => round(max(0.0, min(100.0, $pct)), 2),
            ];

            if (count($out) >= self::MAX_DEDUCTIONS) break;
        }

        return $out ?: self::DEFAULT_DEDUCTIONS;
    }

    /** How many ways net profit is split at the bottom of the table (0 = don't show a share). */
    public static function partnerCount(): int
    {
        $n = Setting::get(self::PARTNERS_KEY);

        return $n === null ? 3 : max(0, min(20, (int) $n));
    }
}
