<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\SchedulePattern\ReplaceRequest;
use App\Http\Resources\System\SchedulePatternResource;
use App\Models\System\SchedulePattern;
use App\Models\System\Student;
use App\Services\System\SchedulePatternService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class SchedulePatternController extends Controller
{
    public function __construct(private SchedulePatternService $service) {}

    public function index(Student $student): JsonResponse
    {
        $this->authorize('viewAny', SchedulePattern::class);

        $patterns = SchedulePattern::where('student_id', $student->id)
            ->with('teacher.user')
            ->orderBy('valid_from')
            ->get();

        return response()->json(SchedulePatternResource::collection($patterns));
    }

    public function replace(ReplaceRequest $request, Student $student): JsonResponse
    {
        $this->authorize('create', SchedulePattern::class);

        $effectiveDate = Carbon::parse($request->effective_date);
        $force         = (bool) $request->input('force_conflicts', false);

        $result = $this->service->replaceForward($student, $effectiveDate, $request->patterns, $force);

        return response()->json([
            'created_sessions' => $result->createdSessions->count(),
            'deleted_sessions' => $result->deletedSessionCount->count(),
            'conflicts'        => collect($result->conflicts)->map(fn ($c) => [
                'session_id' => $c['session']->id,
                'start'      => $c['session']->scheduled_start->toIso8601String(),
                'types'      => collect($c['conflicts'])->pluck('type'),
            ])->values(),
        ]);
    }

    public function preview(ReplaceRequest $request, Student $student): JsonResponse
    {
        $effectiveDate = Carbon::parse($request->effective_date);
        $result        = $this->service->preview($student, $effectiveDate, $request->patterns);

        return response()->json($result);
    }
}
