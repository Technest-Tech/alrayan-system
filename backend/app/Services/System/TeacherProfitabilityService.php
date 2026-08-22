<?php

namespace App\Services\System;

use App\Models\System\Lesson;
use App\Models\System\Teacher;
use App\Support\System\ProfitabilityConfig;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * The Profitability report: what the academy actually keeps, teacher by teacher.
 *
 * Each row walks the same chain the owners reason about:
 *
 *   income  – what the students' packages billed for the hours this teacher taught
 *   cost    – what we owe the teacher for those hours (the salary ladder)
 *   margin  – income − cost
 *   ‑ %     – the configured skims off the margin (ads, charity, …)
 *   net     – what's left
 *
 * Hours and cost come from LessonMetrics/SalaryTiers, exactly like the Analytics
 * page and payroll, so the three can never disagree. Income is *recognised on
 * delivery*, not on payment: a lesson earns its share of the package it consumed
 * (`allocated hours × the package's hourly price`), which is why a teacher's
 * income moves with the month they taught rather than the month a student paid.
 *
 * Unlike Analytics — which deliberately never converts currencies — a P&L has to
 * subtract a USD cost from an EGP income, so everything is converted into one
 * report currency at today's rate. Rows whose currency has no rate are reported
 * as unconvertible rather than silently counted as zero.
 */
class TeacherProfitabilityService
{
    public function __construct(
        private readonly LessonMetrics      $metrics,
        private readonly SalaryTiers        $tiers,
        private readonly LiveFxRateService  $fx,
    ) {}

    /** Resolve `?month=YYYY-MM` to its [start, end] window (mirrors TeacherAnalyticsService). */
    private function monthWindow(?string $month): array
    {
        $now   = Carbon::now();
        $start = $month && preg_match('/^\d{4}-\d{2}$/', $month)
            ? Carbon::createFromFormat('Y-m-d', $month . '-01')->startOfMonth()
            : $now->copy()->startOfMonth();
        $end = $start->copy()->endOfMonth();
        if ($end->greaterThan($now)) $end = $now->copy();

        return [$start, $end];
    }

    private function defaultCurrency(): string
    {
        $configured = Setting::get(ProfitabilityConfig::CURRENCY_KEY);
        if (is_string($configured) && preg_match('/^[A-Z]{3}$/', $configured)) return $configured;

        return Setting::get('reports.base_currency', config('system.default_base_currency', 'EGP'));
    }

    /**
     * Package revenue earned by each teacher in the window, split by the currency
     * the package was priced in.
     *
     * A lesson's revenue is its allocated hours × the package's hourly price
     * (`tariff_at_time / package_hours` — tariff is the whole-package snapshot).
     * Lessons with no allocation (free lessons, trials) correctly earn nothing
     * while still costing us the teacher's time.
     *
     * @return array<int, array<string,int>> teacher_id => [currency => minor]
     */
    private function incomeByTeacher(Carbon $start, Carbon $end): array
    {
        $rows = DB::table('sys_lesson_package_allocations as a')
            ->join('sys_lessons as l', 'l.id', '=', 'a.lesson_id')
            ->join('sys_student_packages as p', 'p.id', '=', 'a.package_id')
            ->whereNull('l.deleted_at')
            ->whereNull('p.deleted_at')
            ->whereIn('l.status', Lesson::TEACHER_PAID_STATUSES)
            ->whereBetween('l.scheduled_at', [$start, $end])
            ->where('p.package_hours', '>', 0)
            ->groupBy('l.teacher_id', 'p.currency')
            ->selectRaw('l.teacher_id, p.currency, SUM(a.hours * p.tariff_at_time / p.package_hours) as income_minor')
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $teacherId = (int) $row->teacher_id;
            $currency  = $row->currency ?: $this->defaultCurrency();

            $out[$teacherId][$currency] = ($out[$teacherId][$currency] ?? 0) + (int) round((float) $row->income_minor);
        }

        return $out;
    }

    /**
     * Full report payload for one month.
     *
     * @param string|null $month    YYYY-MM (defaults to the current month)
     * @param string|null $currency report currency (defaults to the configured one)
     */
    public function report(?string $month, ?string $currency = null): array
    {
        [$start, $end] = $this->monthWindow($month);

        $report     = $currency && preg_match('/^[A-Z]{3}$/', $currency) ? $currency : $this->defaultCurrency();
        $rateMap    = $this->fx->toEgpMap();
        $deductions = ProfitabilityConfig::deductions();
        $costCcy    = SalaryTiers::CURRENCY;

        $income   = $this->incomeByTeacher($start, $end);
        $agg      = $this->metrics->bucketedByTeacher($start, $end);
        $teachers = Teacher::with('user:id,name,photo_url')->get();

        $unconvertible = [];

        /** Convert into the report currency, remembering any currency we couldn't. */
        $toReport = function (int $minor, string $from) use ($report, $rateMap, &$unconvertible): ?int {
            $converted = $this->fx->convertMinor($minor, $from, $report, $rateMap);
            if ($converted === null && $minor !== 0) $unconvertible[$from] = true;

            return $converted;
        };

        $rows = [];
        foreach ($teachers as $teacher) {
            $bucket   = $agg->get($teacher->id);
            $totalMin = (int) ($bucket->total_min ?? 0);
            $hours    = round($totalMin / 60, 2);
            $byCcy    = $income[$teacher->id] ?? [];

            // Skip teachers who neither taught nor billed anything this month —
            // the old report listed only the people who were actually active.
            if ($hours <= 0 && $byCcy === []) continue;

            // Income: converted per source currency, then summed.
            $incomeReport = 0;
            $incomePartial = false;
            foreach ($byCcy as $ccy => $minor) {
                $converted = $toReport($minor, $ccy);
                if ($converted === null) { $incomePartial = true; continue; }
                $incomeReport += $converted;
            }

            // Cost: the salary ladder, same formula payroll pays on.
            $tier      = $this->tiers->tierForHours($hours);
            $costMinor = $this->tiers->salaryMinor($hours);
            $costReport = $toReport($costMinor, $costCcy);
            $costPartial = $costReport === null && $costMinor !== 0;
            $costReport ??= 0;

            $margin = $incomeReport - $costReport;

            $lines     = [];
            $deducted  = 0;
            foreach ($deductions as $line) {
                // Percentages apply to the margin, never to a negative one — a
                // loss-making month shouldn't hand out a negative "ads" credit.
                $amount = $margin > 0 ? (int) round($margin * $line['percent'] / 100) : 0;
                $deducted += $amount;

                $lines[] = [
                    'key'          => $line['key'],
                    'label'        => $line['label'],
                    'percent'      => $line['percent'],
                    'amount_minor' => $amount,
                ];
            }

            $rows[] = [
                'teacher_id'          => $teacher->id,
                'name'                => $teacher->user->name ?? "#{$teacher->id}",
                'photo_url'           => $teacher->user->photo_url ?? null,
                'hours'               => $hours,
                'lessons'             => (int) ($bucket->lessons ?? 0),
                'income_minor'        => $incomeReport,
                'income_by_currency'  => collect($byCcy)
                    ->map(fn($minor, $ccy) => ['currency' => $ccy, 'amount_minor' => $minor])
                    ->values()->all(),
                'rate_minor'          => $tier['rate_minor'],
                'rate_currency'       => $costCcy,
                'tier_index'          => $tier['index'],
                'cost_minor'          => $costMinor,
                'cost_report_minor'   => $costReport,
                'gross_margin_minor'  => $margin,
                'deductions'          => $lines,
                'net_profit_minor'    => $margin - $deducted,
                'margin_pct'          => $incomeReport > 0 ? round($margin / $incomeReport * 100, 1) : null,
                'excluded'            => (bool) $teacher->exclude_from_analytics,
                'partial'             => $incomePartial || $costPartial,
            ];
        }

        // Excluded teachers stay visible but drop out of every total — the same
        // contract the Analytics page's exclusion flag already has.
        $counted = array_values(array_filter($rows, fn($r) => ! $r['excluded']));

        $totals = [
            'hours'              => round(array_sum(array_column($counted, 'hours')), 2),
            'lessons'            => array_sum(array_column($counted, 'lessons')),
            'income_minor'       => array_sum(array_column($counted, 'income_minor')),
            'cost_minor'         => array_sum(array_column($counted, 'cost_report_minor')),
            'gross_margin_minor' => array_sum(array_column($counted, 'gross_margin_minor')),
            'net_profit_minor'   => array_sum(array_column($counted, 'net_profit_minor')),
            'teacher_count'      => count($counted),
            'deductions'         => array_map(
                fn($line) => [
                    'key'          => $line['key'],
                    'label'        => $line['label'],
                    'percent'      => $line['percent'],
                    'amount_minor' => array_sum(array_map(
                        fn($r) => collect($r['deductions'])->firstWhere('key', $line['key'])['amount_minor'] ?? 0,
                        $counted,
                    )),
                ],
                $deductions,
            ),
        ];

        // Blended rate across the counted teachers — the "* Average" of the old table.
        $totals['avg_rate_minor'] = $totals['hours'] > 0
            ? (int) round($totals['cost_minor'] / $totals['hours'])
            : 0;

        $partners = ProfitabilityConfig::partnerCount();
        $totals['partner_count'] = $partners;
        $totals['partner_share_minor'] = $partners > 0
            ? (int) round($totals['net_profit_minor'] / $partners)
            : null;

        return [
            'month'           => $start->format('Y-m'),
            'currency'        => $report,
            'cost_currency'   => $costCcy,
            'rows'            => collect($rows)->sortByDesc('net_profit_minor')->values()->all(),
            'totals'          => $totals,
            'deductions'      => $deductions,
            'partner_count'   => $partners,
            'currencies'      => array_values(array_unique(array_merge(array_keys($rateMap), [$report]))),
            'fx'              => [
                'source'        => $this->fx->toEgp()['source'],
                'fetched_at'    => $this->fx->toEgp()['fetched_at'],
                'unconvertible' => array_keys($unconvertible),
            ],
            'generated_at'    => Carbon::now()->toISOString(),
        ];
    }
}
