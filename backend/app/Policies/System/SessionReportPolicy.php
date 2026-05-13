<?php

namespace App\Policies\System;

use App\Models\System\Session;
use App\Models\System\SessionReport;
use App\Models\User;

class SessionReportPolicy
{
    public function viewAny(User $u): bool
    {
        return $u->role === 'admin' || $u->can('reports.view_any');
    }

    public function view(User $u, SessionReport $r): bool
    {
        if ($u->role === 'admin') return true;
        if ($u->role === 'teacher') return $r->teacher_id === $u->teacher?->id;
        return $u->can('reports.view_any') || $u->can('reports.view');
    }

    public function submit(User $u, Session $s): bool
    {
        return $u->role === 'teacher'
            && $s->teacher_id === $u->teacher?->id
            && $s->status === 'attended';
    }

    public function update(User $u, SessionReport $r): bool
    {
        if ($u->can('reports.edit_any')) return true;
        return $u->role === 'teacher'
            && $r->teacher_id === $u->teacher?->id
            && $u->can('reports.edit_own');
    }

    public function delete(User $u, SessionReport $r): bool
    {
        return $u->role === 'admin' || $u->can('reports.delete_any');
    }
}
