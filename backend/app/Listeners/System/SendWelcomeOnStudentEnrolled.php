<?php

namespace App\Listeners\System;

use App\Events\System\StudentStatusChanged;
use App\Services\System\WassenderDispatcher;
use App\Support\System\Setting;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendWelcomeOnStudentEnrolled implements ShouldQueue
{
    public string $queue = 'notifications';

    public function __construct(private WassenderDispatcher $wa) {}

    public function handle(StudentStatusChanged $event): void
    {
        if ($event->from !== 'trial' || $event->to !== 'active') return;

        $student = $event->student;
        if (!$student->whatsapp_group_id) return;

        $firstSession = $student->sessions()
            ->where('status', 'scheduled')
            ->where('scheduled_start', '>=', now())
            ->orderBy('scheduled_start')
            ->first();

        $this->wa->sendTemplate('welcome_student', $student->whatsappGroup, [
            'student_name'      => $student->name,
            'academy_name'      => Setting::get('academy.name', 'Alrayan Academy'),
            'assigned_teacher'  => $student->assignedTeacher?->user->name ?? '',
            'first_session_time'=> $firstSession
                ? $firstSession->scheduled_start->setTimezone($student->timezone ?? 'UTC')->format('D M j H:i T')
                : 'TBD',
        ]);
    }
}
