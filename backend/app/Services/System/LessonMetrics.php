<?php

namespace App\Services\System;

use App\Models\System\Lesson;
use App\Models\System\Teacher;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Single source of truth for everything derived from taught lessons — hours,
 * lesson counts and teacher earnings.
 *
 * Every reporting surface (dashboard, Teacher Race, teacher profile stats,
 * Analytics, payroll) reads through this service so they can never disagree.
 * The numbers come from `sys_lessons`, the table the calendar actually writes
 * to; the legacy `sys_sessions` table is no longer used for reporting.
 *
 * "Taught" = a lesson the teacher is credited for (Lesson::TEACHER_PAID_STATUSES:
 * attended, paid_absence, free). A trial is never counted for a teacher.
 */
class LessonMetrics
{
    public function __construct(private readonly SalaryTiers $tiers) {}

    /** Duration buckets used for per-minute rate lookup (mirrors the teacher rate card). */
    public const BUCKETS = [30, 45, 60];

    /** Snap a raw lesson length to its 30/45/60 rate bucket. */
    public function bucket(int $minutes): int
    {
        if ($minutes <= 37) return 30;
        if ($minutes <= 52) return 45;
        return 60;
    }

    /** Base query for lessons credited to a teacher, optionally bounded by a window. */
    public function taughtQuery(?Carbon $from = null, ?Carbon $to = null): Builder
    {
        return Lesson::query()
            ->whereIn('status', Lesson::TEACHER_PAID_STATUSES)
            ->when($from && $to, fn($q) => $q->whereBetween('scheduled_at', [$from, $to]));
    }

    /** Taught hours in the window, keyed by teacher id. */
    public function hoursByTeacher(?Carbon $from = null, ?Carbon $to = null): Collection
    {
        return $this->taughtQuery($from, $to)
            ->selectRaw('teacher_id, COALESCE(SUM(duration_minutes), 0) as minutes')
            ->groupBy('teacher_id')
            ->pluck('minutes', 'teacher_id')
            ->map(fn($minutes) => round((int) $minutes / 60, 2));
    }

    /** Taught hours for one teacher in the window. */
    public function hoursForTeacher(int $teacherId, ?Carbon $from = null, ?Carbon $to = null): float
    {
        $minutes = (int) $this->taughtQuery($from, $to)
            ->where('teacher_id', $teacherId)
            ->sum('duration_minutes');

        return round($minutes / 60, 2);
    }

    /** Total taught hours across the academy in the window. */
    public function totalHours(?Carbon $from = null, ?Carbon $to = null): float
    {
        return round((int) $this->taughtQuery($from, $to)->sum('duration_minutes') / 60, 2);
    }

    /**
     * Per-teacher aggregate for the window: lesson count, total minutes and the
     * minutes split across the 30/45/60 rate buckets (for earnings).
     *
     * @return Collection<int, object{teacher_id:int, lessons:int, total_min:int, min30:int, min45:int, min60:int}>
     */
    public function bucketedByTeacher(?Carbon $from = null, ?Carbon $to = null): Collection
    {
        return $this->taughtQuery($from, $to)
            ->selectRaw(
                'teacher_id,
                 COUNT(*) as lessons,
                 COALESCE(SUM(duration_minutes),0) as total_min,
                 COALESCE(SUM(CASE WHEN duration_minutes <= 37 THEN duration_minutes ELSE 0 END),0) as min30,
                 COALESCE(SUM(CASE WHEN duration_minutes > 37 AND duration_minutes <= 52 THEN duration_minutes ELSE 0 END),0) as min45,
                 COALESCE(SUM(CASE WHEN duration_minutes > 52 THEN duration_minutes ELSE 0 END),0) as min60'
            )
            ->groupBy('teacher_id')
            ->get()
            ->keyBy('teacher_id');
    }

    /**
     * What the teacher earned in the window, in minor units: total taught hours
     * priced at the hour-tier rate they reach (see SalaryTiers) — the same
     * formula payroll uses.
     *
     * @param array<int,int>|null $rates legacy per-minute snapshot (bucket => rate);
     *                                   only passed when replaying a pre-ladder payroll
     */
    public function earningsMinor(Teacher $teacher, Carbon $from, Carbon $to, ?array $rates = null): int
    {
        $row = $this->bucketedByTeacher($from, $to)->get($teacher->id);
        if (! $row) return 0;

        if ($rates) {
            return (int) $row->min30 * ($rates[30] ?? 0)
                 + (int) $row->min45 * ($rates[45] ?? 0)
                 + (int) $row->min60 * ($rates[60] ?? 0);
        }

        return $this->tiers->salaryMinor(round((int) $row->total_min / 60, 2));
    }

    /**
     * Lesson counts by status in the window (all statuses, not just taught ones).
     *
     * @return array<string,int>
     */
    public function statusCounts(?int $teacherId = null, ?Carbon $from = null, ?Carbon $to = null): array
    {
        return Lesson::query()
            ->when($teacherId, fn($q) => $q->where('teacher_id', $teacherId))
            ->when($from && $to, fn($q) => $q->whereBetween('scheduled_at', [$from, $to]))
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->map(fn($c) => (int) $c)
            ->toArray();
    }

    /**
     * Taught hours per calendar month over the last N months, oldest first.
     *
     * @return array<int, array{month:string, hours:float, lessons:int}>
     */
    public function hoursByMonth(int $months, ?int $teacherId = null): array
    {
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();
        $end   = Carbon::now()->endOfMonth();

        $rows = $this->taughtQuery($start, $end)
            ->when($teacherId, fn($q) => $q->where('teacher_id', $teacherId))
            ->selectRaw($this->monthExpr('scheduled_at') . ' as ym, COUNT(*) as lessons, COALESCE(SUM(duration_minutes),0) as minutes')
            ->groupBy('ym')
            ->get()
            ->keyBy('ym');

        $out = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i)->startOfMonth();
            $row   = $rows->get($month->format('Y-m'));
            $out[] = [
                'month'   => $month->format('Y-m'),
                'label'   => $month->format('M Y'),
                'hours'   => round((int) ($row->minutes ?? 0) / 60, 1),
                'lessons' => (int) ($row->lessons ?? 0),
            ];
        }

        return $out;
    }

    /** Portable `YYYY-MM` month key expression (MySQL / SQLite / Postgres). */
    public function monthExpr(string $column): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "strftime('%Y-%m', $column)",
            'pgsql'  => "to_char($column, 'YYYY-MM')",
            default  => "DATE_FORMAT($column, '%Y-%m')",
        };
    }
}
