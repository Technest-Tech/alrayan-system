<?php

namespace App\Observers\System;

use App\Models\System\Student;
use App\Services\System\TeacherNotifier;

/**
 * Single-point capture of a teacher getting a student, whichever path assigned them: the user
 * form, a lead (created with a teacher, or reassigned), activation, or the student page.
 */
class StudentObserver
{
    public function __construct(private TeacherNotifier $notifier) {}

    public function created(Student $student): void
    {
        if ($student->assigned_teacher_id) {
            $this->notifier->studentAssigned($student);
        }
    }

    public function updated(Student $student): void
    {
        if ($student->assigned_teacher_id && $student->wasChanged('assigned_teacher_id')) {
            $this->notifier->studentAssigned($student);
        }
    }
}
