<?php

namespace App\Listeners\System;

use App\Events\System\TeacherLeaveApproved;
use App\Services\System\NotificationService;

class NotifyTeacherOnLeaveApproved
{
    public function handle(TeacherLeaveApproved $event): void
    {
        $teacherUserId = $event->leave->teacher?->user_id;
        if (!$teacherUserId) return;

        NotificationService::push(
            userId: $teacherUserId,
            type: 'leave_approved',
            title: 'Leave request approved',
            body: "Your leave from {$event->leave->start_date} to {$event->leave->end_date} has been approved.",
            data: ['leave_id' => $event->leave->id],
        );
    }
}
