<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Lesson;
use App\Models\System\QcEvaluation;
use App\Models\System\Teacher;
use App\Services\System\LessonMetrics;
use Carbon\Carbon;

/**
 * Teacher-facing reporting. Every number here is derived from `sys_lessons`
 * (via LessonMetrics) — the table the calendar writes to — so the Race, the
 * profile dashboard and Analytics always agree.
 */
class TeacherReportController extends Controller
{
    public function __construct(private readonly LessonMetrics $lessons) {}

    /**
     * Collapse the 8 lesson statuses into the 4 buckets the reports UI shows.
     * `trial`/`free` are lessons that were actually given, so they land in
     * "attended"; a paid absence is still an absence from the student's side.
     */
    private function bucketFor(string $status): string
    {
        return match ($status) {
            'attended', 'trial', 'free'                        => 'attended',
            'absent', 'paid_absence'                           => 'absent',
            'cancelled_by_student', 'cancelled_by_teacher',
            'cancelled'                                        => 'cancelled',
            default                                            => 'scheduled',
        };
    }

    /** @param array<string,int> $counts */
    private function bucketCount(array $counts, string $bucket): int
    {
        $sum = 0;
        foreach ($counts as $status => $count) {
            if ($this->bucketFor($status) === $bucket) $sum += (int) $count;
        }
        return $sum;
    }

    public function summary(Teacher $teacher): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $teacher);

        $now       = Carbon::now();
        $yearStart = $now->copy()->startOfYear();

        // period: 30 | 90 | 180 days — default 30
        $days      = in_array((int) request('period'), [30, 90, 180]) ? (int) request('period') : 30;
        $since     = $now->copy()->subDays($days);

        // ── Lessons over chosen period ────────────────────────────────────────
        $counts = $this->lessons->statusCounts($teacher->id, $since, $now);

        $total     = array_sum($counts);
        $attended  = $this->bucketCount($counts, 'attended');
        $absent    = $this->bucketCount($counts, 'absent');
        $cancelled = $this->bucketCount($counts, 'cancelled');
        $scheduled = $this->bucketCount($counts, 'scheduled');

        // ── Total hours taught (attended / paid absence / free) ───────────────
        $hoursTaught = round($this->lessons->hoursForTeacher($teacher->id, $since, $now), 1);

        // ── Lessons by month (covers the chosen period, rounded to months) ────
        $monthCount  = $days <= 30 ? 1 : ($days <= 90 ? 3 : 6);
        $monthlyRows = Lesson::where('teacher_id', $teacher->id)
            ->where('scheduled_at', '>=', $now->copy()->subMonths($monthCount)->startOfMonth())
            ->selectRaw($this->lessons->monthExpr('scheduled_at') . ' as month, status, count(*) as cnt')
            ->groupBy('month', 'status')
            ->orderBy('month')
            ->get();

        $monthly = [];
        foreach ($monthlyRows as $row) {
            $monthly[$row->month] ??= ['month' => $row->month, 'attended' => 0, 'cancelled' => 0, 'absent' => 0, 'scheduled' => 0];
            $monthly[$row->month][$this->bucketFor($row->status)] += $row->cnt;
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
     * window. Drives the gamified race track on the dashboard/profile. Accepts:
     *   ?range=all                        → every attended session, all-time
     *   ?from=YYYY-MM-DD&to=YYYY-MM-DD    → custom date range (inclusive)
     *   ?month=YYYY-MM (default)          → a single calendar month (current if omitted)
     */
    public function race(): \Illuminate\Http\JsonResponse
    {
        $data = request()->validate([
            'range' => ['nullable', 'in:month,all,custom'],
            'month' => ['nullable', 'date_format:Y-m'],
            'from'  => ['nullable', 'required_if:range,custom', 'required_with:to', 'date_format:Y-m-d'],
            'to'    => ['nullable', 'required_if:range,custom', 'required_with:from', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $now   = Carbon::now();
        $range = 'month';
        [$windowStart, $windowEnd, $month] = [null, null, null];

        $from = $data['from'] ?? null;
        $to   = $data['to'] ?? null;

        if (($data['range'] ?? null) === 'all') {
            $range = 'all';                                   // no date bounds
        } elseif (($data['range'] ?? null) === 'custom' || ($from && $to)) {
            $range       = 'custom';
            $windowStart = Carbon::createFromFormat('Y-m-d', $from)->startOfDay();
            $windowEnd   = Carbon::createFromFormat('Y-m-d', $to)->endOfDay();
        } else {
            $m = $data['month'] ?? null;
            $windowStart = $m
                ? Carbon::createFromFormat('Y-m-d', $m . '-01')->startOfMonth()
                : $now->copy()->startOfMonth();
            $windowEnd = $windowStart->copy()->endOfMonth();
            $month     = $windowStart->format('Y-m');
            if ($windowEnd->greaterThan($now)) {
                $windowEnd = $now->copy();
            }
        }

        $hoursByTeacher = $this->lessons->hoursByTeacher($windowStart, $windowEnd);

        $racers = Teacher::where('is_active', true)
            ->with('user:id,name,photo_url')
            ->get()
            ->map(fn(Teacher $t) => [
                'teacher_id' => $t->id,
                'name'       => optional($t->user)->name,
                'photo_url'  => optional($t->user)->photo_url,
                'hours'      => round((float) ($hoursByTeacher[$t->id] ?? 0), 1),
            ])
            ->sortBy([
                ['hours', 'desc'],
                ['name', 'asc'],
            ])
            ->values()
            ->map(fn(array $r, int $i) => [...$r, 'rank' => $i + 1]);

        return response()->json([
            'range'        => $range,
            'month'        => $month,
            'from'         => $windowStart?->format('Y-m-d'),
            'to'           => $windowEnd?->format('Y-m-d'),
            'leader_hours' => (float) ($racers->max('hours') ?? 0),
            'racers'       => $racers->values(),
        ]);
    }

    /**
     * Dashboard stats for the rich teacher profile (KPI cards, mini-calendar, today's lessons).
     * Accepts ?month=YYYY-MM (defaults to the current month) for the calendar / month KPIs.
     */
    public function profileStats(Teacher $teacher): \Illuminate\Http\JsonResponse
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

        // Hours = taught lesson minutes / 60 within a range.
        $hours = fn(Carbon $from, Carbon $to): float => round(
            $this->lessons->hoursForTeacher($teacher->id, $from, $to), 1
        );

        // ── Revenue (what the teacher earned) for the selected & previous month
        $revenue     = $this->lessons->earningsMinor($teacher, $monthStart, $monthEndClamped);
        $revenuePrev = $this->lessons->earningsMinor($teacher, $prevMonthStart, $prevMonthEnd);

        // ── Today / last-7-days windows (relative to now, not the selected month)
        $todayStart   = $now->copy()->startOfDay();
        $todayEnd     = $now->copy()->endOfDay();
        $lastWeekDay  = $now->copy()->subDays(7);

        // ── Quality: average QC evaluation score + evaluations in the last 30 days
        $qualityScore = QcEvaluation::where('teacher_id', $teacher->id)->avg('score');
        $reviews30d   = QcEvaluation::where('teacher_id', $teacher->id)
            ->where('evaluated_at', '>=', $now->copy()->subDays(30))
            ->count();

        // ── Per-day lesson counts for the selected month (calendar dots) ─────
        $calendar = Lesson::where('teacher_id', $teacher->id)
            ->whereBetween('scheduled_at', [$monthStart, $monthEnd])
            ->whereNotIn('status', ['cancelled_by_student', 'cancelled_by_teacher', 'cancelled'])
            ->get(['scheduled_at'])
            ->groupBy(fn($l) => Carbon::parse($l->scheduled_at)->toDateString())
            ->map->count();

        // ── Today's lessons list ─────────────────────────────────────────────
        $todayLessons = Lesson::where('teacher_id', $teacher->id)
            ->whereBetween('scheduled_at', [$todayStart, $todayEnd])
            ->with('student.user')
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn($l) => [
                'id'           => $l->id,
                'time'         => Carbon::parse($l->scheduled_at)->toIso8601String(),
                'student'      => optional($l->student)->name,
                'status'       => $l->status,
                'duration_min' => $l->duration_minutes,
            ]);

        $todayAttended  = $todayLessons->whereIn('status', Lesson::TEACHER_PAID_STATUSES)->count();
        $todayScheduled = $todayLessons->where('status', 'scheduled')->count();

        // ── Pending reports: past lessons that were given but have no report text
        $pendingReports = Lesson::where('teacher_id', $teacher->id)
            ->whereIn('status', Lesson::TEACHER_PAID_STATUSES)
            ->where('scheduled_at', '<', $now)
            ->where(fn($q) => $q->whereNull('content')->orWhere('content', ''))
            ->count();

        $totalStudents  = $teacher->students()->count();
        $activeStudents = $teacher->students()->where('status', 'active')->count();

        return response()->json([
            'month'              => $monthStart->format('Y-m'),
            // Teacher earnings are paid on the USD hour ladder (SalaryTiers),
            // so the money on this card is USD regardless of the teacher's
            // display currency.
            'currency'           => \App\Services\System\SalaryTiers::CURRENCY,
            'total_students'     => $totalStudents,
            'active_students'    => $activeStudents,
            'non_active_students'=> max(0, $totalStudents - $activeStudents),
            'pending_reports'    => $pendingReports,
            'hours_this_month'   => $hours($monthStart, $monthEndClamped),
            'hours_last_month'   => $hours($prevMonthStart, $prevMonthEnd),
            'revenue_minor'      => $revenue,
            'revenue_last_minor' => $revenuePrev,
            'hours_today'        => $hours($todayStart, $todayEnd),
            'hours_prev_week_day'=> $hours($lastWeekDay->copy()->startOfDay(), $lastWeekDay->copy()->endOfDay()),
            'hours_last_7'       => $hours($now->copy()->subDays(7), $now),
            'hours_prev_7'       => $hours($now->copy()->subDays(14), $now->copy()->subDays(7)),
            'quality_score'      => $qualityScore !== null ? (int) round((float) $qualityScore) : 100,
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
