<?php

namespace App\Policies\System;

use App\Models\System\LessonSubject;
use App\Models\User;

class LessonSubjectPolicy
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

    public function view(User $user, LessonSubject $model): bool
    {
        return $user->can('lessons.view');
    }

    public function create(User $user): bool
    {
        return $user->can('lessons.create');
    }

    public function update(User $user, LessonSubject $model): bool
    {
        return $user->can('lessons.edit');
    }

    public function delete(User $user, LessonSubject $model): bool
    {
        return $user->can('lessons.delete');
    }
}
