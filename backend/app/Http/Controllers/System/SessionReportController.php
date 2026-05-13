<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\SessionReport\StoreReportRequest;
use App\Http\Requests\System\SessionReport\UpdateReportRequest;
use App\Http\Resources\System\SessionReportResource;
use App\Models\System\Session;
use App\Models\System\SessionReport;
use App\Models\System\Student;
use App\Models\System\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SessionReport::class);

        $query = SessionReport::with(['student', 'teacher', 'session'])
            ->when($request->teacher_id, fn ($q) => $q->where('teacher_id', $request->teacher_id))
            ->when($request->student_id, fn ($q) => $q->where('student_id', $request->student_id))
            ->when($request->from, fn ($q) => $q->where('submitted_at', '>=', $request->from))
            ->when($request->to, fn ($q) => $q->where('submitted_at', '<=', $request->to))
            ->orderByDesc('submitted_at');

        return response()->json(SessionReportResource::collection($query->paginate(30)));
    }

    public function showForSession(Session $session): JsonResponse
    {
        if (!$session->report) {
            return response()->json(['message' => 'No report submitted yet.'], 404);
        }

        $this->authorize('view', $session->report);
        $session->report->load(['student', 'teacher', 'session']);

        return response()->json(new SessionReportResource($session->report));
    }

    public function store(StoreReportRequest $request, Session $session): JsonResponse
    {
        $this->authorize('submit', [SessionReport::class, $session]);

        if ($session->report) {
            return response()->json(['message' => 'Report already submitted.'], 409);
        }

        $report = SessionReport::create([
            'session_id'         => $session->id,
            'teacher_id'         => $session->teacher_id,
            'student_id'         => $session->student_id,
            'covered_text'       => $request->covered_text,
            'performance'        => $request->performance,
            'homework_text'      => $request->homework_text,
            'next_session_notes' => $request->next_session_notes,
            'submitted_at'       => now(),
        ]);

        // Clear the overdue flag now that a report was submitted
        $session->update(['report_overdue_at' => null]);

        return response()->json(new SessionReportResource($report->load(['student', 'teacher'])), 201);
    }

    public function update(UpdateReportRequest $request, SessionReport $report): JsonResponse
    {
        $this->authorize('update', $report);

        $report->update($request->only(['covered_text', 'performance', 'homework_text', 'next_session_notes']));

        return response()->json(new SessionReportResource($report->load(['student', 'teacher'])));
    }

    public function forStudent(Student $student): JsonResponse
    {
        $reports = SessionReport::where('student_id', $student->id)
            ->with(['teacher', 'session'])
            ->orderByDesc('submitted_at')
            ->paginate(20);

        return response()->json(SessionReportResource::collection($reports));
    }

    public function forTeacher(Teacher $teacher, Request $request): JsonResponse
    {
        if (auth()->user()->role === 'teacher' && auth()->user()->teacher?->id !== $teacher->id) {
            abort(403);
        }

        $reports = SessionReport::where('teacher_id', $teacher->id)
            ->with(['student', 'session'])
            ->orderByDesc('submitted_at')
            ->paginate(20);

        return response()->json(SessionReportResource::collection($reports));
    }
}
