<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Session;
use App\Models\System\Teacher;
use Carbon\Carbon;

class TeacherReportController extends Controller
{
    public function summary(Teacher $teacher): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $teacher);

        $now       = Carbon::now();
        $yearStart = $now->copy()->startOfYear();

        // period: 30 | 90 | 180 days — default 30
        $days  = in_array((int) request('period'), [30, 90, 180]) ? (int) request('period') : 30;
        $since = $now->copy()->subDays($days);

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

        // ── Hours taught (attended sessions × duration) ───────────────────────
        $totalMin = Session::where('teacher_id', $teacher->id)
            ->where('status', 'attended')
            ->where('scheduled_start', '>=', $since)
            ->selectRaw('COALESCE(SUM(duration_min), 0) as total_min')
            ->value('total_min');
        $hoursTaught = round($totalMin / 60, 1);

        // ── Sessions by month ─────────────────────────────────────────────────
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
                'period'            => sprintf('%04d-%02d', $p->period_year, $p->period_month),
                'base_salary_minor' => $p->base_salary_minor,
                'net_salary_minor'  => $p->net_salary_minor,
                'status'            => $p->status,
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
            'monthly_sessions' => array_values($monthly),
            'active_students'  => $activeStudents,
            'leave' => [
                'days_taken_this_year' => $leaveDaysTaken,
                'pending_requests'     => $pendingLeaves,
            ],
            'payrolls' => $payrolls,
        ]);
    }
}
