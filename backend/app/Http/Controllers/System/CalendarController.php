<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\LessonResource;
use App\Models\System\Lesson;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Lesson::class);

        $start = $request->filled('start')
            ? Carbon::parse($request->input('start'))->startOfDay()
            : Carbon::now()->startOfMonth()->startOfDay();

        $end = $request->filled('end')
            ? Carbon::parse($request->input('end'))->endOfDay()
            : Carbon::now()->endOfMonth()->endOfDay();

        $query = Lesson::query()
            ->whereBetween('scheduled_at', [$start, $end])
            ->with(['package', 'teacher.user', 'student', 'subject', 'evaluation'])
            ->orderBy('scheduled_at');

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->input('teacher_id'));
        }

        if ($request->filled('student_id')) {
            $studentIds = (array) $request->input('student_id');
            $query->whereIn('student_id', $studentIds);
        }

        $lessons = $query->get();

        $grouped = $lessons
            ->groupBy(fn($lesson) => Carbon::parse($lesson->scheduled_at)->format('Y-m-d'))
            ->sortKeys()
            ->map(fn($dayLessons, $date) => [
                'date'    => $date,
                'lessons' => LessonResource::collection(
                    $dayLessons->sortBy('scheduled_at')->values()
                ),
            ])
            ->values();

        return response()->json(['data' => $grouped]);
    }
}
