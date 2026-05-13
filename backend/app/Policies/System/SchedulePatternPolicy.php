<?php

namespace App\Policies\System;

use App\Models\System\SchedulePattern;
use App\Models\User;

class SchedulePatternPolicy
{
    public function view(User $u, SchedulePattern $p): bool
    {
        if ($u->role === 'admin') return true;
        if ($u->role === 'teacher') return $p->teacher_id === $u->teacher?->id;
        return $u->can('schedule.view');
    }

    public function viewAny(User $u): bool
    {
        return $u->role === 'admin' || $u->can('schedule.view');
    }

    public function create(User $u): bool
    {
        return $u->role === 'admin' || $u->can('schedule.edit');
    }

    public function update(User $u, SchedulePattern $p): bool
    {
        return $u->role === 'admin' || $u->can('schedule.edit');
    }
}
