<?php

namespace App\Policies\System;

use App\Models\System\LessonSchedule;
use App\Models\User;

class LessonSchedulePolicy
{
    /** Admins bypass all lesson/calendar checks. */
    public function before(User $user, string $ability): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->can('lessons.view');
    }

    public function view(User $user, LessonSchedule $model): bool
    {
        if ($user->role === 'teacher') {
            return $model->teacher_id === $user->teacher?->id;
        }

        return $user->can('lessons.view');
    }

    public function create(User $user): bool
    {
        return $user->can('lessons.create');
    }

    public function update(User $user, LessonSchedule $model): bool
    {
        if ($user->role === 'teacher') {
            return $user->can('lessons.edit') && $model->teacher_id === $user->teacher?->id;
        }

        return $user->can('lessons.edit');
    }

    public function delete(User $user, LessonSchedule $model): bool
    {
        if ($user->role === 'teacher') {
            return $user->can('lessons.delete') && $model->teacher_id === $user->teacher?->id;
        }

        return $user->can('lessons.delete');
    }
}
