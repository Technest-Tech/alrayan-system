<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Teacher;
use App\Services\System\TeacherAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AnalyticsController extends Controller
{
    public function __construct(private readonly TeacherAnalyticsService $analytics) {}

    /** Teacher hours / rates / earnings overview for one month (+ all-time hours chart). */
    public function index(Request $request): JsonResponse
    {
        $month     = $request->query('month');
        $month     = is_string($month) && preg_match('/^\d{4}-\d{2}$/', $month) ? $month : null;
        $teacherId = $request->filled('teacher_id') && $request->query('teacher_id') !== 'all'
            ? (int) $request->query('teacher_id')
            : null;

        $ver = Cache::get('teacher_analytics:ver', 1);
        $key = "teacher_analytics:v{$ver}:" . ($month ?? 'current') . ':' . ($teacherId ?? 'all');

        return response()->json(
            Cache::remember($key, 120, fn () => $this->analytics->overview($month, $teacherId))
        );
    }

    /** Per-teacher month drill-in: revenue + recompenses/deductions (modal). */
    public function teacher(Request $request, Teacher $teacher): JsonResponse
    {
        $teacher->loadMissing('user:id,name');

        $month = $request->query('month');
        $month = is_string($month) && preg_match('/^\d{4}-\d{2}$/', $month) ? $month : null;

        return response()->json($this->analytics->teacherMonth($teacher, $month));
    }

    /** Include/exclude a teacher from the analytics totals. */
    public function setExclusion(Request $request, Teacher $teacher): JsonResponse
    {
        $data = $request->validate(['excluded' => ['required', 'boolean']]);

        $teacher->update(['exclude_from_analytics' => $data['excluded']]);
        Cache::forever('teacher_analytics:ver', ((int) Cache::get('teacher_analytics:ver', 1)) + 1);

        return response()->json(['exclude_from_analytics' => (bool) $teacher->exclude_from_analytics]);
    }
}
