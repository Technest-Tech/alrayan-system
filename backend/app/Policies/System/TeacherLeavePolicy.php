<?php

namespace App\Policies\System;

use App\Models\System\Teacher;
use App\Models\System\TeacherLeave;
use App\Models\User;

class TeacherLeavePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('teachers.view') || $user->role === 'teacher';
    }

    public function create(User $user): bool
    {
        return $user->role === 'teacher' || $user->role === 'admin';
    }

    public function review(User $user, TeacherLeave $leave): bool
    {
        return $user->can('teachers.approve_leave');
    }
}
