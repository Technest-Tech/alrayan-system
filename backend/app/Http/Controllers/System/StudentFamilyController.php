<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Student\SiblingLinkRequest;
use App\Http\Resources\System\StudentDetailResource;
use App\Models\System\Student;
use App\Services\System\FamilyLinkService;

class StudentFamilyController extends Controller
{
    public function __construct(private FamilyLinkService $familyLinks) {}

    public function store(SiblingLinkRequest $request, Student $student): StudentDetailResource
    {
        $this->authorize('update', $student);

        $sibling = Student::findOrFail($request->sibling_id);
        $this->familyLinks->link($student, $sibling, $request->discount_pct);

        return new StudentDetailResource($student->fresh()->load(['siblings.course', 'siblings.assignedTeacher.user']));
    }

    public function destroy(Student $student, Student $sibling): StudentDetailResource
    {
        $this->authorize('update', $student);

        $this->familyLinks->unlink($student, $sibling);

        return new StudentDetailResource($student->fresh()->load(['siblings.course', 'siblings.assignedTeacher.user']));
    }
}
