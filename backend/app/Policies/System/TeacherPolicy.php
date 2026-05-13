<?php

namespace App\Policies\System;

use App\Models\System\Teacher;
use App\Models\User;

class TeacherPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('teachers.view');
    }

    public function view(User $user, Teacher $teacher): bool
    {
        if ($user->role === 'admin') return true;
        if ($user->role === 'teacher') {
            return optional($user->teacher)->id === $teacher->id;
        }
        return $user->can('teachers.view');
    }

    public function create(User $user): bool
    {
        return $user->can('users.invite');
    }

    public function update(User $user, Teacher $teacher): bool
    {
        return $user->can('teachers.edit');
    }

    public function delete(User $user, Teacher $teacher): bool
    {
        return $user->role === 'admin';
    }
}
