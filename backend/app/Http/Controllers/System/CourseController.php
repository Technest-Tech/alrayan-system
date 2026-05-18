<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\CourseResource;
use App\Models\Course;
use App\Models\System\Teacher;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $courses = Course::withCount([
            'students as active_student_count'  => fn($q) => $q->where('status', 'active'),
            'students as paused_student_count'  => fn($q) => $q->where('status', 'paused'),
            'students as total_student_count',
        ])->orderBy('sort_order')->get();

        $teacherCounts = Teacher::select('id', 'teachable_course_ids')
            ->where('is_active', true)
            ->get()
            ->flatMap(fn($t) => $t->teachable_course_ids ?? [])
            ->countBy()
            ->all();

        $courses->each(function ($course) use ($teacherCounts) {
            $course->teacher_count = $teacherCounts[$course->id] ?? 0;
        });

        return CourseResource::collection($courses);
    }

    public function update(Request $request, Course $course): CourseResource
    {
        $data = $request->validate([
            'is_active_for_system' => ['required', 'boolean'],
        ]);

        $course->update($data);

        $course->loadCount([
            'students as active_student_count' => fn($q) => $q->where('status', 'active'),
            'students as paused_student_count' => fn($q) => $q->where('status', 'paused'),
            'students as total_student_count',
        ]);

        $teacherCount = Teacher::where('is_active', true)
            ->whereJsonContains('teachable_course_ids', $course->id)
            ->count();

        $course->teacher_count = $teacherCount;

        return new CourseResource($course);
    }
}
