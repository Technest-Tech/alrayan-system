<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Lesson\StoreLessonScheduleRequest;
use App\Http\Resources\System\LessonScheduleResource;
use App\Models\System\LessonSchedule;
use App\Models\System\LessonScheduleSlot;
use App\Services\System\LessonScheduleService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class LessonScheduleController extends Controller
{
    public function __construct(private LessonScheduleService $scheduleService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LessonSchedule::class);

        $query = LessonSchedule::query()
            ->with(['teacher.user', 'student', 'subject', 'slots']);

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->input('teacher_id'));
        }
        if ($request->filled('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        return LessonScheduleResource::collection($query->get());
    }

    public function show(LessonSchedule $lessonSchedule): LessonScheduleResource
    {
        $this->authorize('view', $lessonSchedule);

        $lessonSchedule->load(['teacher.user', 'student', 'subject', 'slots']);
        $lessonSchedule->loadCount('lessons');

        return new LessonScheduleResource($lessonSchedule);
    }

    public function store(StoreLessonScheduleRequest $request): LessonScheduleResource
    {
        $this->authorize('create', LessonSchedule::class);

        $schedule = LessonSchedule::create([
            'teacher_id' => $request->teacher_id,
            'student_id' => $request->student_id,
            'subject_id' => $request->subject_id,
            'recurrence' => $request->recurrence,
            'start_date' => $request->start_date,
            'is_active'  => true,
        ]);

        foreach ($request->slots as $slot) {
            LessonScheduleSlot::create([
                'schedule_id'      => $schedule->id,
                'day_of_week'      => $slot['day_of_week'],
                'start_time'       => $slot['start_time'],
                'duration_minutes' => $slot['duration_minutes'],
            ]);
        }

        $this->scheduleService->generateLessons($schedule);

        $schedule->load(['teacher.user', 'student', 'subject', 'slots']);

        return new LessonScheduleResource($schedule);
    }

    public function update(Request $request, LessonSchedule $lessonSchedule): LessonScheduleResource
    {
        $this->authorize('update', $lessonSchedule);

        $lessonSchedule->update($request->only([
            'teacher_id',
            'student_id',
            'subject_id',
            'recurrence',
            'start_date',
            'is_active',
        ]));

        if ($request->has('slots')) {
            $lessonSchedule->slots()->delete();

            foreach ($request->input('slots') as $slot) {
                LessonScheduleSlot::create([
                    'schedule_id'      => $lessonSchedule->id,
                    'day_of_week'      => $slot['day_of_week'],
                    'start_time'       => $slot['start_time'],
                    'duration_minutes' => $slot['duration_minutes'],
                ]);
            }
        }

        $lessonSchedule->load(['teacher.user', 'student', 'subject', 'slots']);

        return new LessonScheduleResource($lessonSchedule);
    }

    public function destroy(LessonSchedule $lessonSchedule): Response
    {
        $this->authorize('delete', $lessonSchedule);

        $lessonSchedule->delete();

        return response()->noContent();
    }
}
