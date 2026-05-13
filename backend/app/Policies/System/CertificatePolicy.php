<?php

namespace App\Policies\System;

use App\Models\System\Certificate;
use App\Models\System\Teacher;
use App\Models\User;

class CertificatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === 'admin' || $user->can('certificates.view_any');
    }

    public function view(User $user, Certificate $certificate): bool
    {
        if ($user->role === 'admin' || $user->can('certificates.view_any')) {
            return true;
        }
        $teacher = Teacher::where('user_id', $user->id)->first();
        return $teacher && $certificate->teacher_id === $teacher->id;
    }

    public function create(User $user): bool { return $user->role === 'admin' || $user->can('certificates.issue'); }
    public function update(User $user): bool { return $user->role === 'admin' || $user->can('certificates.edit'); }
    public function revoke(User $user): bool { return $user->role === 'admin' || $user->can('certificates.revoke'); }

    public function download(User $user, Certificate $certificate): bool
    {
        return $this->view($user, $certificate);
    }
}
