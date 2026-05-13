<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\CourseResource;
use App\Models\Course;
use App\Models\System\Student;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $courses = Course::withCount([
            'students as active_student_count' => fn($q) => $q->where('status', 'active'),
        ])->orderBy('sort_order')->get();

        return CourseResource::collection($courses);
    }

    public function update(Request $request, Course $course): CourseResource
    {
        $data = $request->validate([
            'is_active_for_system' => ['required', 'boolean'],
        ]);

        $course->update($data);

        return new CourseResource($course->loadCount([
            'students as active_student_count' => fn($q) => $q->where('status', 'active'),
        ]));
    }
}
