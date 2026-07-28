<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Teacher;
use App\Services\System\LessonMetrics;
use App\Services\System\SalaryTiers;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The admin "Salary Tiers" page: the hour ladder itself plus, for a chosen
 * month, who sits on each tier and what that tier costs the academy.
 *
 * Hours come from `sys_lessons` via LessonMetrics and the money from
 * SalaryTiers — the same pair payroll pays on, so this page is a live preview
 * of the month's salary bill, not a separate estimate.
 */
class SalaryTierController extends Controller
{
    public function __construct(
        private readonly LessonMetrics $metrics,
        private readonly SalaryTiers $tiers,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
        ]);
        [$start, $end] = $this->monthWindow($validated['month'] ?? null);

        $teachers = Teacher::with('user:id,name,photo_url')->get();
        $agg      = $this->metrics->bucketedByTeacher($start, $end);
        $ladder   = $this->tiers->ladder();

        // ── Every teacher placed on the ladder for this month ─────────────────
        $rows = [];
        foreach ($teachers as $teacher) {
            $row      = $agg->get($teacher->id);
            $hours    = round((int) ($row->total_min ?? 0) / 60, 2);
            $progress = $this->tiers->progress($hours);

            $rows[] = [
                'teacher_id'    => $teacher->id,
                'name'          => $teacher->user->name ?? "#{$teacher->id}",
                'photo_url'     => $teacher->user->photo_url ?? null,
                'hours'         => $hours,
                'lessons'       => (int) ($row->lessons ?? 0),
                'tier_index'    => $progress['tier']['index'],
                'rate_minor'    => $progress['rate_minor'],
                'salary_minor'  => $progress['salary_minor'],
                'hours_to_next' => $progress['hours_to_next'],
                'progress_pct'  => $progress['progress_pct'],
                'excluded'      => (bool) $teacher->exclude_from_analytics,
            ];
        }

        // Excluded teachers stay visible in their tier but never move a total.
        $counted = array_values(array_filter($rows, fn ($r) => ! $r['excluded']));

        // ── Per-tier statistics ───────────────────────────────────────────────
        $tierStats = [];
        foreach ($ladder as $tier) {
            $inTier = array_values(array_filter($counted, fn ($r) => $r['tier_index'] === $tier['index']));
            $hours  = array_sum(array_column($inTier, 'hours'));

            $tierStats[] = $tier + [
                'label'              => $tier['max_hours'] === null
                    ? "{$tier['min_hours']}h+"
                    : "{$tier['min_hours']}–{$tier['max_hours']}h",
                'teacher_count'      => count($inTier),
                'total_hours'        => round($hours, 2),
                'total_lessons'      => array_sum(array_column($inTier, 'lessons')),
                'total_salary_minor' => array_sum(array_column($inTier, 'salary_minor')),
                'share_pct'          => count($counted) > 0
                    ? round(count($inTier) / count($counted) * 100, 1)
                    : 0.0,
                'teachers'           => $inTier,
            ];
        }

        $totalHours  = round(array_sum(array_column($counted, 'hours')), 2);
        $totalSalary = array_sum(array_column($counted, 'salary_minor'));
        $active      = array_values(array_filter($counted, fn ($r) => $r['hours'] > 0));

        return response()->json([
            'month'    => $start->format('Y-m'),
            'currency' => SalaryTiers::CURRENCY,
            'tiers'    => $tierStats,
            'kpis'     => [
                'teacher_count'        => count($counted),
                'active_teachers'      => count($active),
                'total_hours'          => $totalHours,
                'total_salary_minor'   => $totalSalary,
                'avg_rate_minor'       => $totalHours > 0 ? (int) round($totalSalary / $totalHours) : 0,
                'avg_hours'            => count($active) > 0
                    ? round($totalHours / count($active), 2)
                    : 0.0,
                'top_tier_index'       => count($active) > 0
                    ? max(array_column($active, 'tier_index'))
                    : null,
            ],
            'teachers'     => collect($rows)->sortByDesc('hours')->values()->all(),
            'generated_at' => Carbon::now()->toISOString(),
        ]);
    }

    /** Resolve `?month=YYYY-MM` to [start, end], never counting the future. */
    private function monthWindow(mixed $month): array
    {
        $now   = Carbon::now();
        $start = is_string($month) && preg_match('/^\d{4}-\d{2}$/', $month)
            ? Carbon::createFromFormat('Y-m-d', $month . '-01')->startOfMonth()
            : $now->copy()->startOfMonth();

        $end = $start->copy()->endOfMonth();
        if ($end->greaterThan($now)) $end = $now->copy();

        return [$start, $end];
    }
}
