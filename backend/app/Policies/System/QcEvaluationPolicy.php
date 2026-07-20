<?php

namespace App\Policies\System;

use App\Models\System\QcEvaluation;
use App\Models\User;

class QcEvaluationPolicy
{
    public function before(User $u, string $ability): ?bool
    {
        return $u->hasRole('admin') ? true : null;
    }

    public function viewAny(User $u): bool
    {
        return $u->can('qc.view');
    }

    public function view(User $u, QcEvaluation $e): bool
    {
        return $u->can('qc.view');
    }

    public function create(User $u): bool
    {
        return $u->can('qc.create');
    }

    public function update(User $u, QcEvaluation $e): bool
    {
        return $u->can('qc.edit');
    }

    public function delete(User $u, QcEvaluation $e): bool
    {
        return $u->can('qc.delete');
    }
}
