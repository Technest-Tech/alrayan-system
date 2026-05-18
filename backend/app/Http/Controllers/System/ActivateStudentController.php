<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Student\ActivateStudentRequest;
use App\Http\Resources\System\StudentDetailResource;
use App\Models\System\Student;
use App\Models\System\StudentNote;
use App\Services\System\StudentLifecycle;
use Illuminate\Support\Facades\DB;

class ActivateStudentController extends Controller
{
    public function __construct(private StudentLifecycle $lifecycle) {}

    public function __invoke(ActivateStudentRequest $request, Student $student): StudentDetailResource
    {
        $this->authorize('changeStatus', $student);

        abort_unless($student->status === 'trial', 422, 'Only trial students can be activated this way.');

        $student = DB::transaction(function () use ($request, $student) {
            $student->update([
                'course_id'             => $request->course_id,
                'assigned_teacher_id'   => $request->assigned_teacher_id,
                'sessions_per_month'    => $request->sessions_per_month,
                'session_duration_min'  => $request->session_duration_min,
                'currency'              => $request->currency,
                'monthly_price_minor'   => $request->monthly_price_minor,
                'custom_discount_pct'   => $request->custom_discount_pct ?? 0,
            ]);

            if ($request->filled('note')) {
                StudentNote::create([
                    'student_id'     => $student->id,
                    'author_user_id' => auth()->id(),
                    'body'           => $request->note,
                ]);
            }

            return $this->lifecycle->transition($student, 'active');
        });

        return new StudentDetailResource($student->load(['course', 'assignedTeacher.user', 'timeline.actor']));
    }
}
