<?php

namespace App\Listeners\System;

use App\Events\System\StudentStatusChanged;
use App\Services\System\WassenderDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;

class NotifyTeacherOnStudentPaused implements ShouldQueue
{
    public string $queue = 'notifications';

    public function __construct(private WassenderDispatcher $wa) {}

    public function handle(StudentStatusChanged $event): void
    {
        if ($event->to !== 'paused') return;

        $student = $event->student;
        $teacher = $student->assignedTeacher;
        if (!$teacher?->whatsapp_group_id) return;

        $this->wa->sendTemplate('student_paused_teacher', $teacher->whatsappGroup, [
            'student_name' => $student->name,
        ]);
    }
}
