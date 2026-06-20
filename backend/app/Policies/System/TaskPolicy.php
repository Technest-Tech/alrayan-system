<?php

namespace App\Policies\System;

use App\Models\System\Task;
use App\Models\User;

class TaskPolicy
{
    public function viewAny(User $u): bool
    {
        return $u->can('tasks.view') || $u->can('tasks.view_any');
    }

    public function view(User $u, Task $t): bool
    {
        if ($u->hasRole('admin')) return true;
        if ($u->can('tasks.view_any')) return true;
        return $u->can('tasks.view')
            && $t->assignee_role !== null
            && $u->hasRole($t->assignee_role);
    }

    public function create(User $u): bool
    {
        return $u->can('tasks.create');
    }

    public function update(User $u, Task $t): bool
    {
        return $u->can('tasks.edit') && $this->view($u, $t);
    }

    public function assign(User $u, Task $t): bool
    {
        return $u->can('tasks.assign');
    }

    public function approve(User $u, Task $t): bool
    {
        return Task::isActionable($t->type) && $u->can('tasks.approve') && $this->view($u, $t);
    }

    public function reject(User $u, Task $t): bool
    {
        return Task::isActionable($t->type) && $u->can('tasks.reject') && $this->view($u, $t);
    }

    public function delete(User $u, Task $t): bool
    {
        return $u->hasRole('admin') && $u->can('tasks.delete');
    }
}
