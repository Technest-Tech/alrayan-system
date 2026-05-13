<?php

namespace App\Listeners\System;

use App\Events\System\TeacherUnderperforming;
use App\Models\User;
use App\Services\System\NotificationService;
use Illuminate\Support\Facades\Cache;

class NotifyAdminsOnTeacherUnderperforming
{
    public function handle(TeacherUnderperforming $e): void
    {
        $cacheKey = "underperforming_notified_{$e->teacher->id}_" . now()->format('Y_W');
        if (Cache::has($cacheKey)) return;
        Cache::put($cacheKey, true, now()->addDays(7));

        User::role(['admin', 'supervisor'])->cursor()->each(function (User $u) use ($e) {
            if (!$u->can('quality.view_any')) return;
            NotificationService::push(
                $u,
                'quality.underperforming',
                $e->teacher->user->name . ' flagged as underperforming',
                'Overall score: ' . $e->overall,
                '/quality/' . $e->teacher->id
            );
        });
    }
}
