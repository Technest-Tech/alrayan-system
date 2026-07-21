<?php

namespace App\Services\System;

use App\Models\System\Payroll;
use App\Models\System\Session;
use App\Models\System\Teacher;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Aggregations behind the admin "Analytics" page (teacher hours / rates /
 * earnings). Everything reads from `sys_sessions` (status = attended) so the
 * numbers line up with payroll and the existing Teacher Race — the newer
 * `sys_lessons` engine is intentionally NOT used here (payroll doesn't use it).
 *
 * Money is in integer minor units. Income uses the same per-minute-by-duration
 * formula as PayrollCalculator; the per-teacher "rate" column is the nominal
 * `hourly_rate` display field (which, unlike the per-minute rates, can hold odd
 * hourly amounts like €3.25 exactly).
 */
class TeacherAnalyticsService
{
    /** Snap a raw session length to its 30/45/60 rate bucket (mirrors PayrollCalculator). */
    private function bucket(int $minutes): int
    {
        if ($minutes <= 37) return 30;
        if ($minutes <= 52) return 45;
        return 60;
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

        // ── Per-teacher attended-session aggregation for the month ────────────
        $agg = Session::query()
            ->where('status', 'attended')
            ->whereBetween('scheduled_start', [$start, $end])
            ->selectRaw(
                'teacher_id,
                 COUNT(*) as lessons,
                 COALESCE(SUM(duration_min),0) as total_min,
                 COALESCE(SUM(CASE WHEN duration_min <= 37 THEN duration_min ELSE 0 END),0) as min30,
                 COALESCE(SUM(CASE WHEN duration_min > 37 AND duration_min <= 52 THEN duration_min ELSE 0 END),0) as min45,
                 COALESCE(SUM(CASE WHEN duration_min > 52 THEN duration_min ELSE 0 END),0) as min60'
            )
            ->groupBy('teacher_id')
            ->get()
            ->keyBy('teacher_id');

        $balances = [];
        foreach ($teachers as $t) {
            $row      = $agg->get($t->id);
            $totalMin = (int) ($row->total_min ?? 0);
            $income   = $row
                ? (int) $row->min30 * (int) $t->per_minute_rate_30
                    + (int) $row->min45 * (int) $t->per_minute_rate_45
                    + (int) $row->min60 * (int) $t->per_minute_rate_60
                : 0;

            $rateMinor = (int) ($t->hourly_rate ?: ((int) $t->per_minute_rate_60 * 60));

            $balances[] = [
                'teacher_id'   => $t->id,
                'name'         => $t->user->name ?? "#{$t->id}",
                'photo_url'    => $t->user->photo_url ?? null,
                'hours'        => round($totalMin / 60, 2),
                'lessons'      => (int) ($row->lessons ?? 0),
                'income_minor' => $income,
                'rate_minor'   => $rateMinor,
                'currency'     => $t->currency ?: $base,
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

    /** Attended-lesson counts grouped by weekday (0 = Sunday … 6 = Saturday). */
    private function bestDaysByLessons(Carbon $start, Carbon $end, array $excludedIds): array
    {
        $counts = array_fill(0, 7, 0);

        Session::query()
            ->where('status', 'attended')
            ->whereBetween('scheduled_start', [$start, $end])
            ->when($excludedIds, fn($q) => $q->whereNotIn('teacher_id', $excludedIds))
            ->pluck('scheduled_start')
            ->each(function ($ts) use (&$counts) {
                $counts[Carbon::parse($ts)->dayOfWeek]++;
            });

        return collect($counts)
            ->map(fn($lessons, $weekday) => ['weekday' => $weekday, 'lessons' => $lessons])
            ->values()
            ->all();
    }

    /**
     * All-time attended hours grouped by month, gaps filled with 0 so the area
     * chart draws a continuous line. Returns the series plus its all-time total.
     */
    private function hoursByMonth(?int $teacherId, array $excludedIds): array
    {
        $rows = Session::query()
            ->where('status', 'attended')
            ->when($teacherId, fn($q) => $q->where('teacher_id', $teacherId))
            ->when($excludedIds, fn($q) => $q->whereNotIn('teacher_id', $excludedIds))
            ->selectRaw($this->monthExpr('scheduled_start') . ' as ym, COALESCE(SUM(duration_min),0) as mins')
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
     * from sessions) plus any bonus ("recompense") / deduction adjustments from
     * the teacher's payroll record for that month, if one has been generated.
     */
    public function teacherMonth(Teacher $teacher, ?string $month): array
    {
        [$start, $end] = $this->monthWindow($month);

        $sessions = Session::query()
            ->where('teacher_id', $teacher->id)
            ->where('status', 'attended')
            ->whereBetween('scheduled_start', [$start, $end])
            ->get(['duration_min']);

        $revenue = 0;
        foreach ($sessions as $s) {
            $rate = (int) $teacher->{'per_minute_rate_' . $this->bucket((int) $s->duration_min)};
            $revenue += (int) $s->duration_min * $rate;
        }

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
