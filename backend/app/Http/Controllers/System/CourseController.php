<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\CourseResource;
use App\Models\Course;
use App\Models\System\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    private const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

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

    public function store(Request $request): CourseResource
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'level'       => ['nullable', Rule::in(self::LEVELS)],
            'age_group'   => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $name        = trim($data['name']);
        $description = isset($data['description']) ? trim($data['description']) : '';

        // Unique slug derived from the name (subject-2, subject-3, … on collision).
        $base = Str::slug($name) ?: 'subject';
        $slug = $base;
        for ($i = 2; Course::where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        $course = Course::create([
            'slug'                 => $slug,
            'title'                => $name,
            'short_description'    => $description ?: $name,
            'long_description'     => $description ?: $name,
            'icon'                 => 'BookOpen',
            'age_group'            => $data['age_group'] ?? null,
            'level'                => $data['level'] ?? 'All Levels',
            'features'             => [],
            'seo_title'            => $name,
            'seo_description'      => $description ?: $name,
            'outcomes'             => [],
            'curriculum'           => [],
            'personas'             => [],
            'faqs'                 => [],
            'related_slugs'        => [],
            'specialty_tags'       => [],
            'active'               => false, // hidden from the public site until its marketing content is filled in
            'is_active_for_system' => true,
            'sort_order'           => (int) Course::max('sort_order') + 1,
        ]);

        $course->active_student_count = 0;
        $course->paused_student_count = 0;
        $course->total_student_count  = 0;
        $course->teacher_count        = 0;

        return new CourseResource($course);
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

    public function destroy(Course $course): JsonResponse
    {
        // Guard against orphaning enrolled students (course_id would null out on delete).
        $studentCount = $course->students()->count();
        if ($studentCount > 0) {
            return response()->json([
                'message' => "Cannot delete \"{$course->title}\" — {$studentCount} student(s) are still enrolled in it.",
            ], 422);
        }

        $course->delete();

        return response()->json(['message' => "\"{$course->title}\" deleted."]);
    }
}
