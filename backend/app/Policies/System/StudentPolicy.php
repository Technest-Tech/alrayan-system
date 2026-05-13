<?php

namespace App\Policies\System;

use App\Models\System\Student;
use App\Models\User;

class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('students.view');
    }

    public function view(User $user, Student $student): bool
    {
        if ($user->role === 'admin') return true;
        if ($user->role === 'teacher') {
            return $student->assigned_teacher_id === optional($user->teacher)->id;
        }
        return $user->can('students.view');
    }

    public function create(User $user): bool
    {
        return $user->can('students.create');
    }

    public function update(User $user, Student $student): bool
    {
        return $user->can('students.edit') && $this->view($user, $student);
    }

    public function changeStatus(User $user, Student $student): bool
    {
        return $user->can('students.change_status') && $this->view($user, $student);
    }

    public function delete(User $user, Student $student): bool
    {
        return $user->role === 'admin';
    }
}
