<?php

namespace App\Policies\System;

use App\Models\System\Payroll;
use App\Models\User;

class PayrollPolicy
{
    public function viewAny(User $u): bool
    {
        return $u->can('payroll.view_any') || $u->hasRole('teacher');
    }

    public function view(User $u, Payroll $p): bool
    {
        if ($u->hasRole('admin')) return true;
        if ($u->hasRole('teacher')) return $p->teacher?->user_id === $u->id;
        return $u->can('payroll.view_any');
    }

    public function adjust(User $u, Payroll $p): bool
    {
        return $u->can('payroll.adjust') && $p->status === 'pending';
    }

    public function approve(User $u, Payroll $p): bool
    {
        return $u->can('payroll.approve') && $p->status === 'pending';
    }

    public function markTransferred(User $u, Payroll $p): bool
    {
        return $u->can('payroll.mark_transferred') && $p->status === 'approved';
    }

    public function export(User $u): bool { return $u->can('payroll.export'); }
}
