<?php

namespace App\Console\Commands\System;

use App\Models\System\Session;
use App\Models\System\WassenderLog;
use App\Services\Integrations\Wassender\WassenderClient;
use App\Services\System\WassenderDispatcher;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Console\Command;

class DispatchSessionReminders extends Command
{
    protected $signature   = 'system:reminders:sessions';
    protected $description = 'Send WhatsApp session reminders to students and teachers (group 60min + direct 5min/on-time)';

    private const DIRECT_WINDOWS = [
        ['key' => '5min', 'offset' => 5, 'slack' => 1],
        ['key' => 'now',  'offset' => 0, 'slack' => 1],
    ];

    public function handle(WassenderDispatcher $wa, WassenderClient $wassender): int
    {
        $this->dispatchGroupReminders($wa);
        $this->dispatchDirectReminders($wassender);

        return self::SUCCESS;
    }

    // ── Existing 60-min group-based reminders (unchanged) ────────────────

    private function dispatchGroupReminders(WassenderDispatcher $wa): void
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

            if ($s->student->whatsapp_group_id && $s->student->whatsappGroup) {
                $log = $wa->sendTemplate('session_reminder_student', $s->student->whatsappGroup, [
                    'student_name'       => $s->student->name,
                    'teacher_name'       => $s->teacher->user->name,
                    'session_time_local' => $s->scheduled_start->setTimezone($s->student->timezone ?? 'UTC')->format('H:i T'),
                    'course_name'        => $s->student->course->name ?? '',
                    'zoom_join_url'      => $s->zoom_join_url ?? '',
                ]);
                $log->update(['payload' => array_merge($log->payload ?? [], ['session_id' => $s->id])]);
            }

            if ($s->teacher->whatsapp_group_id && $s->teacher->whatsappGroup) {
                $log = $wa->sendTemplate('session_reminder_teacher', $s->teacher->whatsappGroup, [
                    'teacher_name'       => $s->teacher->user->name,
                    'student_name'       => $s->student->name,
                    'session_time_local' => $s->scheduled_start->setTimezone($s->teacher->user->timezone ?? 'Africa/Cairo')->format('H:i T'),
                    'course_name'        => $s->student->course->name ?? '',
                    'zoom_start_url'     => $s->zoom_start_url ?? '',
                    'duration_min'       => (string) $s->duration_min,
                ]);
                $log->update(['payload' => array_merge($log->payload ?? [], ['session_id' => $s->id])]);
            }
        }
    }

    // ── New 5-min and on-time direct-phone reminders ─────────────────────

    private function dispatchDirectReminders(WassenderClient $wa): void
    {
        foreach (self::DIRECT_WINDOWS as ['key' => $key, 'offset' => $offset, 'slack' => $slack]) {
            $target = now()->addMinutes($offset);

            $sessions = Session::query()
                ->where('status', 'scheduled')
                ->whereBetween('scheduled_start', [
                    $target->copy()->subMinutes($slack),
                    $target->copy()->addMinutes($slack),
                ])
                ->whereHas('student', fn ($q) => $q->whereIn('status', ['active', 'trial']))
                ->with(['student', 'teacher.user'])
                ->whereDoesntHave('wassenderLogs', function ($q) use ($key) {
                    $q->where('template_key', 'like', "session_reminder_{$key}_%")
                      ->whereRaw("JSON_EXTRACT(payload, '$.session_id') = sys_sessions.id");
                })
                ->limit(500)
                ->get();

            foreach ($sessions as $s) {
                $student      = $s->student;
                $teacher      = $s->teacher;
                if (!$student || !$teacher?->user) continue;

                $studentPhone = preg_replace('/[\s\-]/', '', $student->whatsapp ?: $student->phone ?: '');
                $teacherPhone = preg_replace('/[\s\-]/', '', $teacher->user->whatsapp ?: $teacher->user->phone ?: '');
                $studentTime  = Carbon::parse($s->scheduled_start)->setTimezone($student->timezone ?? 'UTC')->format('g:i A T');
                $teacherTime  = Carbon::parse($s->scheduled_start)->setTimezone($teacher->user->timezone ?? 'Africa/Cairo')->format('g:i A T');

                if ($studentPhone) {
                    $msg    = $this->studentMessage($key, $student->name, $teacher->user->name, $studentTime, $s->zoom_join_url ?? '');
                    $result = $wa->sendToPhone($studentPhone, $msg);
                    $this->log("session_reminder_{$key}_student", $studentPhone, $msg, $result->success, $result->externalId, $result->errorBody, $s->id, 'student_id', $student->id);
                }

                if ($teacherPhone) {
                    $msg    = $this->teacherMessage($key, $teacher->user->name, $student->name, $teacherTime, $s->zoom_start_url ?? '', $s->duration_min);
                    $result = $wa->sendToPhone($teacherPhone, $msg);
                    $this->log("session_reminder_{$key}_teacher", $teacherPhone, $msg, $result->success, $result->externalId, $result->errorBody, $s->id, 'teacher_id', $teacher->id);
                }
            }
        }
    }

    private function studentMessage(string $key, string $student, string $teacher, string $time, string $zoomUrl): string
    {
        $zoomLine = $zoomUrl ? "\n🔗 *Join Now:* {$zoomUrl}" : '';
        return match ($key) {
            '5min' => trim(implode("\n", [
                '🚀 *Session in 5 Minutes!*',
                '',
                "*{$student}*, your session with *{$teacher}* starts in 5 minutes at *{$time}*.",
                $zoomLine,
                '_Alrayan Academy_',
            ])),
            'now' => trim(implode("\n", [
                '🟢 *Your Session is Starting Now!*',
                '',
                "Assalamu Alaikum *{$student}*, your session with *{$teacher}* is starting!",
                $zoomLine,
                '_Alrayan Academy_',
            ])),
            default => '',
        };
    }

    private function teacherMessage(string $key, string $teacher, string $student, string $time, string $zoomUrl, int $duration): string
    {
        $zoomLine = $zoomUrl ? "\n🔗 *Start Zoom:* {$zoomUrl}" : '';
        return match ($key) {
            '5min' => trim(implode("\n", [
                '📢 *Session in 5 Minutes*',
                '',
                "*{$teacher}*, your session with *{$student}* starts in 5 minutes at *{$time}* ({$duration} min).",
                $zoomLine,
                '_Alrayan Academy_',
            ])),
            'now' => trim(implode("\n", [
                '🟢 *Session Starting Now*',
                '',
                "Assalamu Alaikum *{$teacher}*, your session with *{$student}* is starting!",
                $zoomLine,
                '_Alrayan Academy_',
            ])),
            default => '',
        };
    }

    private function log(
        string  $templateKey,
        string  $phone,
        string  $message,
        bool    $success,
        ?string $externalId,
        ?string $error,
        int     $sessionId,
        string  $recipientKey,
        int     $recipientId,
    ): void {
        WassenderLog::create([
            'template_key'        => $templateKey,
            'recipient_phone'     => $phone,
            'rendered_message'    => $message,
            'status'              => $success ? 'sent' : 'failed',
            'external_message_id' => $externalId,
            'attempt_count'       => 1,
            'error'               => $success ? null : $error,
            'sent_at'             => $success ? now() : null,
            'payload'             => ['session_id' => $sessionId, $recipientKey => $recipientId],
        ]);
    }
}
