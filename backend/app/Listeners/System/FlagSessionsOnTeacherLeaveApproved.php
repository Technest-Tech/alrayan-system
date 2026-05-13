<?php

namespace App\Listeners\System;

use App\Events\System\TeacherLeaveApproved;
use App\Jobs\System\DeleteSessionZoomMeeting;
use App\Models\System\Session;
use App\Models\User;
use App\Services\System\NotificationService;

class FlagSessionsOnTeacherLeaveApproved
{
    public function handle(TeacherLeaveApproved $event): void
    {
        $leave = $event->leave;

        $sessions = Session::where('teacher_id', $leave->teacher_id)
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_start', [
                $leave->start_date->startOfDay(),
                $leave->end_date->endOfDay(),
            ])->get();

        foreach ($sessions as $s) {
            $s->update(['status' => 'pending_substitute']);
            DeleteSessionZoomMeeting::dispatch($s);
        }

        if ($sessions->isNotEmpty()) {
            $teacherName = $leave->teacher->user->name ?? 'unknown';
            $msg = "{$sessions->count()} sessions need a substitute (teacher: {$teacherName})";

            User::whereIn('role', ['admin', 'supervisor'])->cursor()->each(function (User $u) use ($msg) {
                NotificationService::push($u, 'sessions.pending_substitute', $msg, null, '/schedule?status=pending_substitute');
            });
        }
    }
}
