<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Student\StoreStudentRequest;
use App\Http\Requests\System\Student\UpdateStudentRequest;
use App\Http\Resources\System\StudentDetailResource;
use App\Http\Resources\System\StudentResource;
use App\Models\System\Guardian;
use App\Models\System\Student;
use App\Models\System\StudentNote;
use App\Models\System\StudentTimelineEntry;
use App\Models\TrialBooking;
use App\Services\System\AuditLog;
use App\Services\System\StudentTimelineRecorder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class StudentController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize('viewAny', Student::class);

        $students = QueryBuilder::for(Student::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('course_id'),
                AllowedFilter::exact('assigned_teacher_id'),
                AllowedFilter::exact('country'),
                AllowedFilter::exact('student_type'),
                AllowedFilter::scope('no_whatsapp'),
                AllowedFilter::scope('q', 'search'),
            ])
            ->allowedSorts(['created_at', 'enrolled_at', 'name'])
            ->defaultSort('-created_at')
            ->with(['course', 'assignedTeacher.user', 'guardian'])
            ->paginate($request->integer('per_page', 25));

        return StudentResource::collection($students);
    }

    public function show(Student $student): StudentDetailResource
    {
        $this->authorize('view', $student);

        $student->load([
            'guardian.students',
            'course',
            'assignedTeacher.user',
            'siblings.course',
            'siblings.assignedTeacher.user',
            'timeline.actor',
            'notes.author',
        ]);

        return new StudentDetailResource($student);
    }

    public function store(StoreStudentRequest $request): StudentDetailResource
    {
        $this->authorize('create', Student::class);

        $student = DB::transaction(function () use ($request) {
            // Resolve or create guardian for child students
            $guardianId = null;
            if ($request->student_type === 'child') {
                if ($request->filled('guardian_id')) {
                    $guardianId = $request->guardian_id;
                } else {
                    $guardian   = Guardian::create([
                        'name'     => $request->guardian_name,
                        'whatsapp' => $request->guardian_whatsapp,
                    ]);
                    $guardianId = $guardian->id;
                }
            }

            $student = Student::create([
                'name'                  => $request->name,
                'email'                 => $this->generateStudentEmail($request->name),
                'whatsapp'              => $request->whatsapp,
                'country'               => $request->country,
                'timezone'              => $request->timezone,
                'student_type'          => $request->student_type,
                'guardian_id'           => $guardianId,
                'course_id'             => $request->course_id,
                'assigned_teacher_id'   => $request->assigned_teacher_id,
                'sessions_per_month'    => $request->sessions_per_month ?? 0,
                'session_duration_min'  => $request->session_duration_min ?? 30,
                'currency'              => $request->currency ?? 'USD',
                'monthly_price_minor'   => $request->monthly_price_minor ?? 0,
                'custom_discount_pct'   => $request->custom_discount_pct ?? 0,
                'source'                => $request->source ?? 'manual',
                'trial_booking_id'      => $request->trial_booking_id,
                'status'                => 'trial',
            ]);

            StudentTimelineEntry::create([
                'student_id'    => $student->id,
                'actor_user_id' => auth()->id(),
                'event_type'    => 'created',
                'payload'       => ['source' => $student->source],
            ]);

            if ($request->filled('note')) {
                StudentNote::create([
                    'student_id'     => $student->id,
                    'author_user_id' => auth()->id(),
                    'body'           => $request->note,
                ]);
            }

            if ($request->trial_booking_id) {
                TrialBooking::where('id', $request->trial_booking_id)
                    ->update(['converted_to_student_id' => $student->id]);
            }

            AuditLog::record('student.created', $student);

            return $student;
        });

        return new StudentDetailResource($student->load(['guardian.students', 'course', 'assignedTeacher.user']));
    }

    public function update(UpdateStudentRequest $request, Student $student): StudentDetailResource
    {
        $this->authorize('update', $student);

        $old = $student->only(['assigned_teacher_id', 'monthly_price_minor', 'currency', 'sessions_per_month', 'session_duration_min']);

        $student->update($request->validated());

        $recorder = app(StudentTimelineRecorder::class);

        if ($request->has('assigned_teacher_id') && $old['assigned_teacher_id'] !== $student->assigned_teacher_id) {
            $recorder->record($student, 'teacher_changed', [
                'old' => $old['assigned_teacher_id'],
                'new' => $student->assigned_teacher_id,
            ]);
        }

        if ($request->hasAny(['monthly_price_minor', 'currency', 'sessions_per_month', 'session_duration_min'])) {
            $newPrice = $student->only(['monthly_price_minor', 'currency', 'sessions_per_month', 'session_duration_min']);
            if ($old !== array_merge($old, $newPrice)) {
                $recorder->record($student, 'price_changed', ['old' => $old, 'new' => $newPrice]);
            }
        }

        return new StudentDetailResource($student->fresh()->load(['course', 'assignedTeacher.user']));
    }

    private function generateStudentEmail(string $name): string
    {
        $domain   = config('app.student_email_domain', 'students.alrayanquran.com');
        $slug     = Str::slug($name, '.');
        $email    = "{$slug}@{$domain}";
        $counter  = 2;

        while (Student::where('email', $email)->exists()) {
            $email = "{$slug}.{$counter}@{$domain}";
            $counter++;
        }

        return $email;
    }

    public function destroy(int $student): \Illuminate\Http\JsonResponse
    {
        $model = Student::findOrFail($student);

        $this->authorize('delete', $model);

        $model->delete();

        return response()->json(['deleted' => true]);
    }
}
