<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Student\TransitionRequest;
use App\Http\Resources\System\StudentDetailResource;
use App\Models\System\Student;
use App\Services\System\StudentLifecycle;

class StudentTransitionController extends Controller
{
    public function __construct(private StudentLifecycle $lifecycle) {}

    public function __invoke(TransitionRequest $request, Student $student): StudentDetailResource
    {
        $this->authorize('changeStatus', $student);

        $student = $this->lifecycle->transition($student, $request->to, [
            'reason' => $request->reason,
            'notes'  => $request->notes,
            'admin_manual_override' => auth()->user()->role === 'admin',
        ]);

        return new StudentDetailResource($student->load(['course', 'assignedTeacher.user', 'timeline.actor']));
    }
}
