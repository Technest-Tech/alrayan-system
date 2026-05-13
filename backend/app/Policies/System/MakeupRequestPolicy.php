<?php

namespace App\Policies\System;

use App\Models\System\MakeupRequest;
use App\Models\System\Session;
use App\Models\User;

class MakeupRequestPolicy
{
    public function viewAny(User $u): bool
    {
        return $u->role === 'admin' || $u->can('makeups.view');
    }

    public function view(User $u, MakeupRequest $r): bool
    {
        if ($u->role === 'admin') return true;
        if ($u->role === 'teacher') return $r->originalSession?->teacher_id === $u->teacher?->id;
        return $u->can('makeups.view');
    }

    public function create(User $u, Session $s): bool
    {
        if ($u->role === 'admin') return true;
        if ($u->role === 'teacher') return $s->teacher_id === $u->teacher?->id;
        return $u->can('makeups.request');
    }

    public function approve(User $u): bool
    {
        return $u->role === 'admin' || $u->can('makeups.approve');
    }
}
