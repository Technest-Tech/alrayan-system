<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\QualityReview;
use App\Models\System\Session;
use App\Models\System\Teacher;
use App\Services\System\PayrollCalculator;
use App\Support\System\Setting;
use Carbon\Carbon;

class TeacherReportController extends Controller
{
    public function summary(Teacher $teacher): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $teacher);

        $now       = Carbon::now();
        $yearStart = $now->copy()->startOfYear();

        // period: 30 | 90 | 180 days — default 30
        $days      = in_array((int) request('period'), [30, 90, 180]) ? (int) request('period') : 30;
        $since     = $now->copy()->subDays($days);

        // ── Sessions over chosen period ───────────────────────────────────────
        $sessionRows = Session::where('teacher_id', $teacher->id)
            ->where('scheduled_start', '>=', $since)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $total     = array_sum($sessionRows);
        $attended  = $sessionRows['attended']  ?? 0;
        $absent    = $sessionRows['absent']    ?? 0;
        $cancelled = ($sessionRows['cancelled'] ?? 0) + ($sessionRows['rescheduled'] ?? 0);
        $scheduled = $sessionRows['scheduled'] ?? 0;

        // ── Total hours taught (attended sessions) ────────────────────────────
        $hoursRow = Session::where('teacher_id', $teacher->id)
            ->where('status', 'attended')
            ->where('scheduled_start', '>=', $since)
            ->selectRaw('COALESCE(SUM(duration_min), 0) as total_min')
            ->value('total_min');
        $hoursTaught = round($hoursRow / 60, 1);

        // ── Sessions by month (covers the chosen period, rounded to months) ──
        $monthCount  = $days <= 30 ? 1 : ($days <= 90 ? 3 : 6);
        $monthlyRows = Session::where('teacher_id', $teacher->id)
            ->where('scheduled_start', '>=', $now->copy()->subMonths($monthCount)->startOfMonth())
            ->selectRaw("DATE_FORMAT(scheduled_start, '%Y-%m') as month, status, count(*) as cnt")
            ->groupBy('month', 'status')
            ->orderBy('month')
            ->get();

        $monthly = [];
        foreach ($monthlyRows as $row) {
            $monthly[$row->month] ??= ['month' => $row->month, 'attended' => 0, 'cancelled' => 0, 'absent' => 0, 'scheduled' => 0];
            $key = in_array($row->status, ['cancelled', 'rescheduled']) ? 'cancelled' : $row->status;
            $monthly[$row->month][$key] += $row->cnt;
        }
        $monthly = array_values($monthly);

        // ── Active students ───────────────────────────────────────────────────
        $activeStudents = $teacher->students()->where('status', 'active')->count();

        // ── Leave this year ───────────────────────────────────────────────────
        $leaveDaysTaken = $teacher->leaves()
            ->where('status', 'approved')
            ->where('start_date', '>=', $yearStart->toDateString())
            ->get()
            ->sum(fn($l) => Carbon::parse($l->start_date)->diffInDays(Carbon::parse($l->end_date)) + 1);

        $pendingLeaves = $teacher->leaves()->where('status', 'pending')->count();

        // ── Last 6 payrolls ───────────────────────────────────────────────────
        $payrolls = $teacher->payrolls()
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->limit(6)
            ->get(['period_year', 'period_month', 'base_salary_minor', 'net_salary_minor', 'status'])
            ->map(fn($p) => [
                'period'               => sprintf('%04d-%02d', $p->period_year, $p->period_month),
                'base_salary_minor'    => $p->base_salary_minor,
                'net_salary_minor'     => $p->net_salary_minor,
                'status'               => $p->status,
            ]);

        return response()->json([
            'period_days' => $days,
            'sessions' => [
                'total'           => $total,
                'attended'        => $attended,
                'absent'          => $absent,
                'cancelled'       => $cancelled,
                'scheduled'       => $scheduled,
                'hours_taught'    => $hoursTaught,
                'attendance_rate' => $total > 0 ? round($attended / $total * 100, 1) : null,
            ],
            'monthly_sessions' => $monthly,
            'active_students'  => $activeStudents,
            'leave' => [
                'days_taken_this_year' => $leaveDaysTaken,
                'pending_requests'     => $pendingLeaves,
            ],
            'payrolls' => $payrolls,
        ]);
    }

    /**
     * Teacher Race leaderboard — all active teachers ranked by hours taught in the selected
     * month (?month=YYYY-MM, defaults to current). Drives the gamified race track on the profile.
     */
    public function race(): \Illuminate\Http\JsonResponse
    {
        $now = Carbon::now();
        $month = request('month');
        $monthStart = $month && preg_match('/^\d{4}-\d{2}$/', $month)
            ? Carbon::createFromFormat('Y-m-d', $month . '-01')->startOfMonth()
            : $now->copy()->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();
        if ($monthEnd->greaterThan($now)) $monthEnd = $now->copy();

        $minsByTeacher = Session::where('status', 'attended')
            ->whereBetween('scheduled_start', [$monthStart, $monthEnd])
            ->selectRaw('teacher_id, COALESCE(SUM(duration_min), 0) as mins')
            ->groupBy('teacher_id')
            ->pluck('mins', 'teacher_id');

        $racers = Teacher::where('is_active', true)
            ->with('user:id,name,photo_url')
            ->get()
            ->map(fn(Teacher $t) => [
                'teacher_id' => $t->id,
                'name'       => optional($t->user)->name,
                'photo_url'  => optional($t->user)->photo_url,
                'hours'      => round((int) ($minsByTeacher[$t->id] ?? 0) / 60, 1),
            ])
            ->sortByDesc('hours')
            ->values()
            ->map(fn(array $r, int $i) => [...$r, 'rank' => $i + 1]);

        return response()->json([
            'month'        => $monthStart->format('Y-m'),
            'leader_hours' => (float) ($racers->max('hours') ?? 0),
            'racers'       => $racers->values(),
        ]);
    }

    /**
     * Dashboard stats for the rich teacher profile (KPI cards, mini-calendar, today's lessons).
     * Accepts ?month=YYYY-MM (defaults to the current month) for the calendar / month KPIs.
     */
    public function profileStats(Teacher $teacher, PayrollCalculator $payroll): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $teacher);

        $now = Carbon::now();

        // ── Selected month (for "this month" KPIs + calendar) ────────────────
        $month = request('month');
        $monthStart = $month && preg_match('/^\d{4}-\d{2}$/', $month)
            ? Carbon::createFromFormat('Y-m-d', $month . '-01')->startOfMonth()
            : $now->copy()->startOfMonth();
        $monthEnd     = $monthStart->copy()->endOfMonth();
        // Don't count the future when the selected month is the current month.
        $monthEndClamped = $monthEnd->greaterThan($now) ? $now->copy() : $monthEnd->copy();

        $prevMonthStart = $monthStart->copy()->subMonth()->startOfMonth();
        $prevMonthEnd   = $monthStart->copy()->subMonth()->endOfMonth();

        // Hours = attended-session minutes / 60 within a range.
        $hours = fn(Carbon $from, Carbon $to): float => round(
            Session::where('teacher_id', $teacher->id)
                ->where('status', 'attended')
                ->whereBetween('scheduled_start', [$from, $to])
                ->sum('duration_min') / 60,
            1
        );

        // ── Revenue (teacher earnings = payroll base) for selected & prev month
        $revenue     = $payroll->calculate($teacher, $monthStart, $monthEndClamped)->baseSalaryMinor;
        $revenuePrev = $payroll->calculate($teacher, $prevMonthStart, $prevMonthEnd)->baseSalaryMinor;

        // ── Today / last-7-days windows (relative to now, not the selected month)
        $todayStart   = $now->copy()->startOfDay();
        $todayEnd     = $now->copy()->endOfDay();
        $lastWeekDay  = $now->copy()->subDays(7);

        // ── Quality: latest review score + reviews in the last 30 days ───────
        $latestQuality = QualityReview::where('teacher_id', $teacher->id)
            ->orderByDesc('period_year')->orderByDesc('period_month')
            ->value('overall_score');
        $reviews30d = QualityReview::where('teacher_id', $teacher->id)
            ->where('created_at', '>=', $now->copy()->subDays(30))
            ->count();

        // ── Per-day session counts for the selected month (calendar dots) ────
        $calendar = Session::where('teacher_id', $teacher->id)
            ->whereBetween('scheduled_start', [$monthStart, $monthEnd])
            ->whereIn('status', ['attended', 'scheduled'])
            ->get(['scheduled_start'])
            ->groupBy(fn($s) => Carbon::parse($s->scheduled_start)->toDateString())
            ->map->count();

        // ── Today's lessons list ─────────────────────────────────────────────
        $todayLessons = Session::where('teacher_id', $teacher->id)
            ->whereBetween('scheduled_start', [$todayStart, $todayEnd])
            ->with('student.user')
            ->orderBy('scheduled_start')
            ->get()
            ->map(fn($s) => [
                'id'           => $s->id,
                'time'         => Carbon::parse($s->scheduled_start)->toIso8601String(),
                'student'      => optional(optional($s->student)->user)->name,
                'status'       => $s->status,
                'duration_min' => $s->duration_min,
            ]);

        $todayAttended  = $todayLessons->where('status', 'attended')->count();
        $todayScheduled = $todayLessons->where('status', 'scheduled')->count();

        return response()->json([
            'month'              => $monthStart->format('Y-m'),
            'currency'           => Setting::get('reports.base_currency', config('system.default_base_currency', 'EGP')),
            'total_students'     => $teacher->students()->where('status', 'active')->count(),
            'hours_this_month'   => $hours($monthStart, $monthEndClamped),
            'hours_last_month'   => $hours($prevMonthStart, $prevMonthEnd),
            'revenue_minor'      => $revenue,
            'revenue_last_minor' => $revenuePrev,
            'hours_today'        => $hours($todayStart, $todayEnd),
            'hours_prev_week_day'=> $hours($lastWeekDay->copy()->startOfDay(), $lastWeekDay->copy()->endOfDay()),
            'hours_last_7'       => $hours($now->copy()->subDays(7), $now),
            'hours_prev_7'       => $hours($now->copy()->subDays(14), $now->copy()->subDays(7)),
            'quality_score'      => $latestQuality !== null ? (int) $latestQuality : 100,
            'quality_reviews_30d'=> $reviews30d,
            'calendar'           => $calendar,
            'today'              => [
                'attended'  => $todayAttended,
                'scheduled' => $todayScheduled,
                'lessons'   => $todayLessons->values(),
            ],
        ]);
    }
}
