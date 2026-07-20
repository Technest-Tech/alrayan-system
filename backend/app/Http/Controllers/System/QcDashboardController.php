<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\QcEvaluation;
use App\Models\System\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class QcDashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $startMonth = Carbon::now()->startOfMonth();
        $startWeek  = Carbon::now()->startOfWeek();

        return response()->json([
            'data' => [
                'kpis' => [
                    'total'              => QcEvaluation::count(),
                    'this_month'         => QcEvaluation::where('evaluated_at', '>=', $startMonth)->count(),
                    'this_week'          => QcEvaluation::where('evaluated_at', '>=', $startWeek)->count(),
                    'average_score'      => round((float) QcEvaluation::avg('score'), 1),
                    'teachers_evaluated' => (int) QcEvaluation::whereNotNull('teacher_id')->distinct()->count('teacher_id'),
                ],
                'top_teachers' => [
                    'this_month' => $this->topTeachers($startMonth),
                    'all_time'   => $this->topTeachers(null),
                ],
                'supervisor_activity' => $this->supervisorActivity(),
            ],
        ]);
    }

    /** @return array<int, array<string, mixed>> */
    private function topTeachers(?Carbon $since): array
    {
        $rows = QcEvaluation::query()
            ->select('teacher_id', DB::raw('COUNT(*) as evaluations_count'), DB::raw('AVG(score) as avg_score'))
            ->whereNotNull('teacher_id')
            ->when($since, fn ($q) => $q->where('evaluated_at', '>=', $since))
            ->groupBy('teacher_id')
            ->orderByDesc('avg_score')
            ->orderByDesc('evaluations_count')
            ->limit(10)
            ->get();

        $names = Teacher::with('user')->whereIn('id', $rows->pluck('teacher_id'))->get()->keyBy('id');

        return $rows->map(fn ($r) => [
            'teacher_id'        => $r->teacher_id,
            'teacher_name'      => $names->get($r->teacher_id)?->user?->name,
            'evaluations_count' => (int) $r->evaluations_count,
            'avg_score'         => round((float) $r->avg_score, 1),
        ])->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function supervisorActivity(): array
    {
        $rows = QcEvaluation::query()
            ->select('quality_manager_id', DB::raw('COUNT(*) as evaluations_count'), DB::raw('AVG(score) as avg_score'))
            ->whereNotNull('quality_manager_id')
            ->groupBy('quality_manager_id')
            ->orderByDesc('evaluations_count')
            ->get();

        $names = User::whereIn('id', $rows->pluck('quality_manager_id'))->get()->keyBy('id');

        return $rows->map(fn ($r) => [
            'quality_manager_id' => $r->quality_manager_id,
            'name'               => $names->get($r->quality_manager_id)?->name,
            'evaluations_count'  => (int) $r->evaluations_count,
            'avg_score'          => round((float) $r->avg_score, 1),
        ])->all();
    }
}
