<?php

namespace App\Policies\System;

use App\Models\User;

class AuditLogPolicy
{
    public function view(User $user): bool   { return $user->role === 'admin' || $user->can('audit.view'); }
    public function export(User $user): bool { return $this->view($user); }
}
