<?php

namespace App\Policies\System;

use App\Models\System\Lead;
use App\Models\User;

class LeadPolicy
{
    public function viewAny(User $u): bool
    {
        return $u->can('leads.view') || $u->can('leads.view_any');
    }

    public function view(User $u, Lead $l): bool
    {
        if ($u->hasRole('admin')) return true;
        if ($u->can('leads.view_any')) return true;
        return $l->assigned_supervisor_id === $u->id && $u->can('leads.view');
    }

    public function create(User $u): bool
    {
        return $u->can('leads.create');
    }

    public function update(User $u, Lead $l): bool
    {
        return ($u->hasRole('admin') || $l->assigned_supervisor_id === $u->id) && $u->can('leads.edit');
    }

    public function assign(User $u): bool
    {
        return $u->can('leads.assign');
    }

    public function convert(User $u, Lead $l): bool
    {
        return $this->view($u, $l) && $u->can('leads.convert');
    }

    public function markLost(User $u, Lead $l): bool
    {
        return $this->view($u, $l) && $u->can('leads.mark_lost');
    }

    public function delete(User $u, Lead $l): bool
    {
        return $u->hasRole('admin') && $u->can('leads.delete');
    }
}
