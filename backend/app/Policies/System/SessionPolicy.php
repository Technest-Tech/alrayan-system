<?php

namespace App\Policies\System;

use App\Models\System\Session;
use App\Models\User;

class SessionPolicy
{
    public function view(User $u, Session $s): bool
    {
        if ($u->role === 'admin') return true;
        if ($u->role === 'teacher') return $s->teacher_id === $u->teacher?->id;
        return $u->can('schedule.view') || $u->can('attendance.view') || $u->can('reports.view_any');
    }

    public function create(User $u): bool
    {
        return $u->role === 'admin' || $u->can('schedule.edit');
    }

    public function update(User $u, Session $s): bool
    {
        if ($u->role === 'admin') return true;
        return $u->can('schedule.edit') && $this->view($u, $s);
    }

    public function reschedule(User $u, Session $s): bool
    {
        return $u->role === 'admin' || $u->can('schedule.reschedule');
    }

    public function cancel(User $u, Session $s): bool
    {
        if ($u->role === 'admin') return true;
        if ($u->role === 'teacher') return $s->teacher_id === $u->teacher?->id;
        return $u->can('sessions.cancel');
    }

    public function markAttendance(User $u, Session $s): bool
    {
        if ($u->role === 'admin') return true;
        if ($u->role === 'teacher') return $s->teacher_id === $u->teacher?->id;
        return $u->can('attendance.edit');
    }
}
