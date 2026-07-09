<?php

namespace App\Console\Commands\System;

use App\Models\System\Session;
use App\Services\System\WassenderDispatcher;
use App\Support\System\Setting;
use Illuminate\Console\Command;

class DispatchSessionReminders extends Command
{
    protected $signature   = 'system:reminders:sessions';
    protected $description = 'Send WhatsApp session reminders to students and teachers';

    public function handle(WassenderDispatcher $wa): int
    {
        $offset = (int) Setting::get('reminders.session.before_minutes', 60);
        $window = now()->addMinutes($offset);

        $sessions = Session::query()
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_start', [
                $window->copy()->subMinute(),
                $window->copy()->addMinute(),
            ])
            ->with(['student.whatsappGroup', 'student.course', 'teacher.user', 'teacher.whatsappGroup'])
            ->whereDoesntHave('wassenderLogs', function ($q) {
                $q->where('template_key', 'like', 'session_reminder%')
                  ->whereRaw("JSON_EXTRACT(payload, '$.session_id') = sys_sessions.id");
            })
            ->limit(500)
            ->get();

        foreach ($sessions as $s) {
            if (!in_array($s->student->status, ['active', 'trial'], true)) continue;

            // teacher_id is nullOnDelete: a session can outlive its teacher.
            $teacher     = $s->teacher;
            $teacherName = $teacher?->user?->name ?? '—';

            if ($s->student->whatsapp_group_id && $s->student->whatsappGroup) {
                $log = $wa->sendTemplate('session_reminder_student', $s->student->whatsappGroup, [
                    'student_name'       => $s->student->name,
                    'teacher_name'       => $teacherName,
                    'session_time_local' => $s->scheduled_start->setTimezone($s->student->timezone ?? 'UTC')->format('H:i T'),
                    'course_name'        => $s->student->course->name ?? '',
                    'zoom_join_url'      => $s->zoom_join_url ?? '',
                ]);
                $log->update(['payload' => array_merge($log->payload ?? [], ['session_id' => $s->id])]);
            }

            if ($teacher?->whatsapp_group_id && $teacher->whatsappGroup) {
                $log = $wa->sendTemplate('session_reminder_teacher', $teacher->whatsappGroup, [
                    'teacher_name'       => $teacherName,
                    'student_name'       => $s->student->name,
                    'session_time_local' => $s->scheduled_start->setTimezone($teacher->user?->timezone ?? 'Africa/Cairo')->format('H:i T'),
                    'course_name'        => $s->student->course->name ?? '',
                    'zoom_start_url'     => $s->zoom_start_url ?? '',
                    'duration_min'       => (string) $s->duration_min,
                ]);
                $log->update(['payload' => array_merge($log->payload ?? [], ['session_id' => $s->id])]);
            }
        }

        return self::SUCCESS;
    }
}
