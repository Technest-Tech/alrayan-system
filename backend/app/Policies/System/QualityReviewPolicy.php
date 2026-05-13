<?php

namespace App\Policies\System;

use App\Models\System\QualityReview;
use App\Models\System\Teacher;
use App\Models\User;

class QualityReviewPolicy
{
    public function viewAny(User $u): bool { return $u->can('quality.view_any') || $u->hasRole('teacher'); }

    public function view(User $u, QualityReview $r): bool
    {
        if ($u->hasRole('admin')) return true;
        if ($u->hasRole('teacher')) return $r->teacher->user_id === $u->id;
        return $u->can('quality.view_any');
    }

    public function create(User $u): bool { return $u->can('quality.review'); }

    public function review(User $u, Teacher $t): bool { return $u->can('quality.review'); }
}
