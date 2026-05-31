<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Lesson\StoreLessonRequest;
use App\Http\Requests\System\Lesson\UpdateLessonRequest;
use App\Http\Resources\System\LessonResource;
use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Services\System\PackageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class LessonController extends Controller
{
    public function __construct(private PackageService $packageService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Lesson::class);

        $query = Lesson::query()
            ->with(['package', 'teacher.user', 'student', 'subject', 'evaluation']);

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->input('teacher_id'));
        }
        if ($request->filled('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('package_id')) {
            $query->where('package_id', $request->input('package_id'));
        }

        $sort = $request->input('sort', '-scheduled_at');
        if ($sort === 'session_number_hours') {
            $query->orderBy('session_number_hours');
        } elseif ($sort === '-session_number_hours') {
            $query->orderByDesc('session_number_hours');
        } elseif ($sort === 'scheduled_at') {
            $query->orderBy('scheduled_at');
        } else {
            $query->orderByDesc('scheduled_at');
        }

        return LessonResource::collection($query->paginate(50));
    }

    public function show(Lesson $lesson): LessonResource
    {
        $this->authorize('view', $lesson);

        $lesson->load(['package', 'teacher.user', 'student', 'subject', 'evaluation', 'addedBy', 'schedule']);

        return new LessonResource($lesson);
    }

    public function store(StoreLessonRequest $request): LessonResource
    {
        $this->authorize('create', Lesson::class);

        $student = Student::findOrFail($request->student_id);
        $scheduledAt = Carbon::parse($request->scheduled_at);

        $package = $this->packageService->resolvePackageForLesson($student, $scheduledAt);

        $lesson = Lesson::create([
            'package_id'       => $package->id,
            'schedule_id'      => $request->input('schedule_id'),
            'teacher_id'       => $request->teacher_id,
            'student_id'       => $request->student_id,
            'subject_id'       => $request->subject_id,
            'evaluation_id'    => $request->evaluation_id,
            'added_by'         => auth()->id(),
            'scheduled_at'     => $scheduledAt,
            'duration_minutes' => $request->duration_minutes,
            'status'           => $request->input('status', 'scheduled'),
            'content'          => $request->content,
            'notes'            => $request->notes,
            'homework'         => $request->homework,
            'souvenir_image'   => $request->souvenir_image,
            'subject_details'  => $request->subject_details,
        ]);

        $this->packageService->recalculateSessionNumbers($package->id);

        $lesson->load(['package', 'teacher.user', 'student', 'subject', 'evaluation', 'addedBy']);

        return new LessonResource($lesson);
    }

    public function update(UpdateLessonRequest $request, Lesson $lesson): LessonResource
    {
        $this->authorize('update', $lesson);

        $lesson->update($request->only([
            'teacher_id',
            'student_id',
            'subject_id',
            'evaluation_id',
            'scheduled_at',
            'duration_minutes',
            'status',
            'content',
            'notes',
            'homework',
            'souvenir_image',
            'subject_details',
        ]));

        if ($lesson->package_id) {
            $this->packageService->recalculateSessionNumbers($lesson->package_id);
        }

        $lesson->load(['package', 'teacher.user', 'student', 'subject', 'evaluation', 'addedBy']);

        return new LessonResource($lesson);
    }

    public function destroy(Lesson $lesson): Response
    {
        $this->authorize('delete', $lesson);

        $packageId = $lesson->package_id;

        $lesson->delete();

        if ($packageId) {
            $this->packageService->recalculateSessionNumbers($packageId);
        }

        return response()->noContent();
    }
}
