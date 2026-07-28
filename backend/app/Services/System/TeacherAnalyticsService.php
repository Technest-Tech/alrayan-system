<?php

namespace App\Services\System;

use App\Models\System\Payroll;
use App\Models\System\Teacher;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Aggregations behind the admin "Analytics" page (teacher hours / rates /
 * earnings). Everything reads from `sys_lessons` via LessonMetrics — the same
 * source as payroll, the Teacher Race and the teacher dashboard, so all four
 * always show the same hours.
 *
 * Money is in integer minor units. Income uses the same hour-tier formula as
 * PayrollCalculator (see SalaryTiers): total taught hours × the rate of the
 * tier those hours reach, in USD. The "rate" column is that tier rate.
 */
class TeacherAnalyticsService
{
    public function __construct(
        private readonly LessonMetrics $metrics,
        private readonly SalaryTiers $tiers,
    ) {}

    /** Snap a raw lesson length to its 30/45/60 rate bucket (mirrors PayrollCalculator). */
    private function bucket(int $minutes): int
    {
        return $this->metrics->bucket($minutes);
    }

    private function baseCurrency(): string
    {
        return Setting::get('reports.base_currency', config('system.default_base_currency', 'EGP'));
    }

    /** Portable `YYYY-MM` month key expression for grouping (MySQL / SQLite / Postgres). */
    private function monthExpr(string $col): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "strftime('%Y-%m', $col)",
            'pgsql'  => "to_char($col, 'YYYY-MM')",
            default  => "DATE_FORMAT($col, '%Y-%m')",
        };
    }

    /** Resolve `?month=YYYY-MM` to the [start, end] window (mirrors TeacherReportController::race). */
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

    /**
     * Full payload for the Analytics page for one month.
     *
     * @param string|null $month     YYYY-MM (defaults to current month)
     * @param int|null    $teacherId filters the "Hours Across Months" chart only
     */
    public function overview(?string $month, ?int $teacherId = null): array
    {
        [$start, $end] = $this->monthWindow($month);
        $base = $this->baseCurrency();

        /** @var \Illuminate\Support\Collection<int,Teacher> $teachers */
        $teachers    = Teacher::with('user:id,name,photo_url')->get();
        $excludedIds = $teachers->where('exclude_from_analytics', true)->pluck('id')->all();

        // ── Per-teacher taught-lesson aggregation for the month ───────────────
        $agg = $this->metrics->bucketedByTeacher($start, $end);

        $balances = [];
        foreach ($teachers as $t) {
            $row      = $agg->get($t->id);
            $totalMin = (int) ($row->total_min ?? 0);
            $hours    = round($totalMin / 60, 2);

            // Earnings follow the hour ladder (SalaryTiers) — the same formula
            // payroll pays on, so Analytics and the salary slip always agree.
            $tier      = $this->tiers->tierForHours($hours);
            $income    = $this->tiers->salaryMinor($hours);
            $rateMinor = $tier['rate_minor'];

            $balances[] = [
                'teacher_id'   => $t->id,
                'name'         => $t->user->name ?? "#{$t->id}",
                'photo_url'    => $t->user->photo_url ?? null,
                'hours'        => $hours,
                'lessons'      => (int) ($row->lessons ?? 0),
                'income_minor' => $income,
                'rate_minor'   => $rateMinor,
                'tier_index'   => $tier['index'],
                'currency'     => SalaryTiers::CURRENCY,
                'excluded'     => (bool) $t->exclude_from_analytics,
            ];
        }

        // Totals — everything below excludes flagged teachers. Money is NEVER
        // converted across currencies; income/rate roll up per currency.
        $counted     = array_values(array_filter($balances, fn($b) => ! $b['excluded']));
        $totalMinutes = 0;
        $totalLessons = 0;
        $byCurrency   = [];
        foreach ($counted as $b) {
            $mins = (int) round($b['hours'] * 60);
            $totalMinutes += $mins;
            $totalLessons += $b['lessons'];

            $c = $b['currency'];
            $byCurrency[$c] ??= ['currency' => $c, 'income_minor' => 0, 'minutes' => 0, 'teacher_count' => 0];
            $byCurrency[$c]['income_minor']  += $b['income_minor'];
            $byCurrency[$c]['minutes']       += $mins;
            $byCurrency[$c]['teacher_count'] += 1;
        }
        $totalHours      = round($totalMinutes / 60, 2);
        $countedTeachers = count($counted);
        $avgHours        = $countedTeachers > 0 ? round($totalHours / $countedTeachers, 2) : 0.0;

        $totalsByCurrency = collect($byCurrency)
            ->map(function ($g) {
                $hours = round($g['minutes'] / 60, 2);
                return [
                    'currency'       => $g['currency'],
                    'income_minor'   => $g['income_minor'],
                    'hours'          => $hours,
                    'avg_rate_minor' => $hours > 0 ? (int) round($g['income_minor'] / $hours) : 0,
                    'teacher_count'  => $g['teacher_count'],
                ];
            })
            ->sortByDesc('income_minor')
            ->values()
            ->all();

        // ── Top 5 teachers by hours this month ────────────────────────────────
        $topTeachers = collect($counted)
            ->filter(fn($b) => $b['hours'] > 0)
            ->sortByDesc('hours')
            ->take(5)
            ->map(fn($b) => [
                'teacher_id' => $b['teacher_id'],
                'name'       => $b['name'],
                'hours'      => $b['hours'],
            ])
            ->values()
            ->all();

        return [
            'month'         => $start->format('Y-m'),
            'base_currency' => $base,
            'kpis'       => [
                'total_hours'           => $totalHours,
                'avg_hours_per_teacher' => $avgHours,
                'total_lessons'         => $totalLessons,
                'totals_by_currency'    => $totalsByCurrency,
            ],
            'top_teachers'    => $topTeachers,
            'best_days'       => $this->bestDaysByLessons($start, $end, $excludedIds),
            'hours_by_month'  => $this->hoursByMonth($teacherId, $teacherId ? [] : $excludedIds),
            'teacher_balances' => collect($balances)->sortByDesc('hours')->values()->all(),
            'teachers'        => $teachers
                ->map(fn($t) => ['id' => $t->id, 'name' => $t->user->name ?? "#{$t->id}"])
                ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
                ->values()
                ->all(),
            'excluded_count'  => count($excludedIds),
            'generated_at'    => Carbon::now()->toISOString(),
        ];
    }

    /** Taught-lesson counts grouped by weekday (0 = Sunday … 6 = Saturday). */
    private function bestDaysByLessons(Carbon $start, Carbon $end, array $excludedIds): array
    {
        $counts = array_fill(0, 7, 0);

        $this->metrics->taughtQuery($start, $end)
            ->when($excludedIds, fn($q) => $q->whereNotIn('teacher_id', $excludedIds))
            ->pluck('scheduled_at')
            ->each(function ($ts) use (&$counts) {
                $counts[Carbon::parse($ts)->dayOfWeek]++;
            });

        return collect($counts)
            ->map(fn($lessons, $weekday) => ['weekday' => $weekday, 'lessons' => $lessons])
            ->values()
            ->all();
    }

    /**
     * All-time taught hours grouped by month, gaps filled with 0 so the area
     * chart draws a continuous line. Returns the series plus its all-time total.
     */
    private function hoursByMonth(?int $teacherId, array $excludedIds): array
    {
        $rows = $this->metrics->taughtQuery()
            ->when($teacherId, fn($q) => $q->where('teacher_id', $teacherId))
            ->when($excludedIds, fn($q) => $q->whereNotIn('teacher_id', $excludedIds))
            ->selectRaw($this->monthExpr('scheduled_at') . ' as ym, COALESCE(SUM(duration_minutes),0) as mins')
            ->groupBy('ym')
            ->orderBy('ym')
            ->pluck('mins', 'ym');

        if ($rows->isEmpty()) {
            return ['series' => [], 'all_time_total' => 0.0];
        }

        $keys   = $rows->keys();
        $cursor = Carbon::createFromFormat('Y-m-d', $keys->first() . '-01')->startOfMonth();
        $last   = Carbon::createFromFormat('Y-m-d', $keys->last() . '-01')->startOfMonth();

        $series = [];
        $total  = 0.0;
        while ($cursor->lessThanOrEqualTo($last)) {
            $ym    = $cursor->format('Y-m');
            $hours = round(((int) ($rows[$ym] ?? 0)) / 60, 2);
            $series[] = ['month' => $ym, 'hours' => $hours];
            $total += $hours;
            $cursor->addMonth();
        }

        return ['series' => $series, 'all_time_total' => round($total, 2)];
    }

    /**
     * Per-teacher month breakdown for the drill-in modal: revenue (base earnings
     * from lessons) plus any bonus ("recompense") / deduction adjustments from
     * the teacher's payroll record for that month, if one has been generated.
     */
    public function teacherMonth(Teacher $teacher, ?string $month): array
    {
        [$start, $end] = $this->monthWindow($month);

        $revenue = $this->metrics->earningsMinor($teacher, $start, $end);

        $payroll = Payroll::query()
            ->where('teacher_id', $teacher->id)
            ->where('period_year', (int) $start->format('Y'))
            ->where('period_month', (int) $start->format('n'))
            ->with('adjustments')
            ->first();

        $mapAdjustments = fn(string $type) => $payroll
            ? $payroll->adjustments
                ->where('type', $type)
                ->map(fn($a) => [
                    'id'           => $a->id,
                    'category'     => $a->category,
                    'amount_minor' => $a->amount_minor,
                    'reason'       => $a->reason,
                ])
                ->values()
                ->all()
            : [];

        return [
            'teacher'       => ['id' => $teacher->id, 'name' => $teacher->user->name ?? "#{$teacher->id}"],
            'month'         => $start->format('Y-m'),
            'currency'      => $teacher->currency ?: $this->baseCurrency(),
            'revenue_minor' => $revenue,
            'recompenses'   => $mapAdjustments('bonus'),
            'deductions'    => $mapAdjustments('deduction'),
        ];
    }
}
