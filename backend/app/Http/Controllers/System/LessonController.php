<?php

namespace App\Http\Controllers\System;

use App\Exceptions\System\UnreachableRecipientException;
use App\Http\Controllers\Controller;
use App\Http\Requests\System\Lesson\StoreLessonRequest;
use App\Http\Requests\System\Lesson\UpdateLessonRequest;
use App\Http\Resources\System\LessonResource;
use App\Jobs\System\SendLessonReport;
use App\Models\System\Lead;
use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Services\System\PackageService;
use App\Services\System\Reports\LessonReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class LessonController extends Controller
{
    public function __construct(
        private PackageService $packageService,
        private LessonReportService $reports,
    ) {}

    /**
     * Rendering + sending happens on the queue, so an unreachable student would
     * otherwise surface as a silent no-op long after the admin closed the form.
     * Checking up front lets the request fail loudly instead.
     */
    private function assertReportDeliverable(Student $student): void
    {
        try {
            $this->reports->assertReachable($student);
        } catch (UnreachableRecipientException $e) {
            throw ValidationException::withMessages(['send_report' => $e->getMessage()]);
        }
    }

    /**
     * Resolve the teacher_id to persist on a write. A teacher is always forced
     * to their own id and may only act on their own students; admins/supervisors
     * keep whatever was requested.
     */
    private function resolveWriteTeacherId(int $requestedTeacherId, Student $student): int
    {
        if (auth()->user()->role !== 'teacher') {
            return $requestedTeacherId;
        }

        $teacherId = (int) auth()->user()->teacher?->id;
        abort_unless($student->assigned_teacher_id === $teacherId, 403, 'You can only create lessons for your own students.');

        return $teacherId;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Lesson::class);

        $query = Lesson::query()
            ->with(['package', 'teacher.user', 'student', 'subject', 'evaluation', 'allocations.package']);

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->input('teacher_id'));
        }
        // A teacher only ever sees their own lessons, regardless of any filter.
        if (auth()->user()->role === 'teacher') {
            $query->where('teacher_id', auth()->user()->teacher?->id);
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

        $lesson->load(['package', 'teacher.user', 'student', 'subject', 'evaluation', 'addedBy', 'schedule', 'allocations.package']);

        return new LessonResource($lesson);
    }

    public function store(StoreLessonRequest $request): LessonResource
    {
        $this->authorize('create', Lesson::class);

        $student = Student::findOrFail($request->student_id);
        $teacherId = $this->resolveWriteTeacherId((int) $request->teacher_id, $student);
        $scheduledAt = Carbon::parse($request->scheduled_at);

        $sendReport = $request->boolean('send_report');

        if ($sendReport) {
            $this->assertReportDeliverable($student);
        }

        $package = $this->packageService->resolvePackageForLesson($student, $scheduledAt);

        $lesson = Lesson::create([
            'package_id'       => $package->id,
            'schedule_id'      => $request->input('schedule_id'),
            'teacher_id'       => $teacherId,
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
            'trial_evaluation' => $request->trial_evaluation,
        ]);

        // Re-distribute the whole student chronologically (splits, session numbers, completion).
        $this->packageService->rebuild($student);

        // A trial lesson + its report means the lead is ready for payment.
        if ($lesson->status === 'trial') {
            $this->advanceLeadAfterTrial($student->id);
        }

        $lesson->refresh()->load(['package', 'teacher.user', 'student', 'subject', 'evaluation', 'addedBy', 'allocations.package']);

        // Dispatched after the rebuild so the report shows settled package progress.
        if ($sendReport) {
            SendLessonReport::dispatch($lesson->id)->onQueue('notifications');
        }

        return new LessonResource($lesson);
    }

    /**
     * Once a trial lesson is logged for a lead-sourced student, advance that lead to
     * "waiting for payment" (only from earlier open stages — never reopen a closed/lost lead).
     */
    private function advanceLeadAfterTrial(int $studentId): void
    {
        $lead = Lead::where('student_id', $studentId)
            ->whereIn('status', ['new_lead', 'interested', 'waiting_for_trial'])
            ->first();

        if ($lead) {
            $lead->update(['status' => 'waiting_for_payment']);
        }
    }

    public function update(UpdateLessonRequest $request, Lesson $lesson): LessonResource
    {
        $this->authorize('update', $lesson);

        $data = $request->only([
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
            'trial_evaluation',
        ]);

        $sendReport = $request->boolean('send_report');

        if ($sendReport && ($target = Student::find($data['student_id'] ?? $lesson->student_id))) {
            $this->assertReportDeliverable($target);
        }

        // A teacher can never reassign a lesson to another teacher or a student
        // that isn't theirs.
        if (auth()->user()->role === 'teacher') {
            $teacherId = (int) auth()->user()->teacher?->id;
            $data['teacher_id'] = $teacherId;
            if (! empty($data['student_id'])) {
                $student = Student::find($data['student_id']);
                abort_unless($student && $student->assigned_teacher_id === $teacherId, 403, 'You can only assign your own students.');
            }
        }

        $lesson->update($data);

        // A date / duration / status change can shift every package — re-distribute.
        if ($student = $lesson->student) {
            $this->packageService->rebuild($student);

            // Marking a lesson as a trial advances the lead to "waiting for payment".
            if ($lesson->status === 'trial') {
                $this->advanceLeadAfterTrial($student->id);
            }
        }

        $lesson->refresh()->load(['package', 'teacher.user', 'student', 'subject', 'evaluation', 'addedBy', 'allocations.package']);

        if ($sendReport) {
            SendLessonReport::dispatch($lesson->id)->onQueue('notifications');
        }

        return new LessonResource($lesson);
    }

    public function destroy(Lesson $lesson): Response
    {
        $this->authorize('delete', $lesson);

        $student = $lesson->student;

        $lesson->delete();

        if ($student) {
            $this->packageService->rebuild($student);
        }

        return response()->noContent();
    }
}
