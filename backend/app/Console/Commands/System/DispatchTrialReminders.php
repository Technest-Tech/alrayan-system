<?php

namespace App\Console\Commands\System;

use App\Models\System\Session;
use App\Models\System\WassenderLog;
use App\Services\Integrations\Wassender\WassenderClient;
use Carbon\Carbon;
use Illuminate\Console\Command;

class DispatchTrialReminders extends Command
{
    protected $signature   = 'system:reminders:trials';
    protected $description = 'Send WhatsApp reminders to trial students and teachers at 2h, 5min, and session-start';

    private const WINDOWS = [
        ['key' => '2h',    'offset' => 120, 'slack' => 2],
        ['key' => '5min',  'offset' => 5,   'slack' => 1],
        ['key' => 'now',   'offset' => 0,   'slack' => 1],
    ];

    public function handle(WassenderClient $wa): int
    {
        foreach (self::WINDOWS as $window) {
            $this->processWindow($wa, $window['key'], $window['offset'], $window['slack']);
        }
        return self::SUCCESS;
    }

    private function processWindow(WassenderClient $wa, string $key, int $offsetMin, int $slack): void
    {
        $target = now()->addMinutes($offsetMin);

        $sessions = Session::query()
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_start', [
                $target->copy()->subMinutes($slack),
                $target->copy()->addMinutes($slack),
            ])
            ->whereHas('student', fn ($q) => $q->where('status', 'trial'))
            ->with(['student', 'teacher.user'])
            ->whereNotExists(function ($q) use ($key) {
                $q->select(\DB::raw(1))
                  ->from('sys_wassender_logs')
                  ->where('template_key', 'like', "trial_reminder_{$key}_%")
                  ->whereRaw("JSON_EXTRACT(payload, '$.session_id') = sys_sessions.id");
            })
            ->limit(200)
            ->get();

        foreach ($sessions as $session) {
            $student = $session->student;
            $teacher = $session->teacher;
            if (!$student || !$teacher?->user) continue;

            $sessionStart = Carbon::parse($session->scheduled_start);
            $studentPhone = preg_replace('/[\s\-]/', '', $student->whatsapp ?: $student->phone ?: '');
            $teacherPhone = preg_replace('/[\s\-]/', '', $teacher->user->whatsapp ?: $teacher->user->phone ?: '');
            $studentTime  = $sessionStart->copy()->setTimezone($student->timezone ?? 'UTC')->format('g:i A T');
            $teacherTime  = $sessionStart->copy()->setTimezone($teacher->user->timezone ?? 'Africa/Cairo')->format('g:i A T');
            $teacherName  = $teacher->user->name;
            $studentName  = $student->name;
            $joinUrl      = $session->zoom_join_url ?? '';
            $startUrl     = $session->zoom_start_url ?? '';

            // ── Student reminder ────────────────────────────────────────
            if ($studentPhone) {
                $msg = $this->studentMessage($key, $studentName, $teacherName, $studentTime, $joinUrl);
                $result = $wa->sendToPhone($studentPhone, $msg);
                $this->logResult("trial_reminder_{$key}_student", $studentPhone, $msg, $result->success, $result->externalId, $result->errorBody, $session->id, 'student_id', $student->id);
            }

            // ── Teacher reminder ────────────────────────────────────────
            if ($teacherPhone) {
                $msg = $this->teacherMessage($key, $teacherName, $studentName, $teacherTime, $startUrl, $session->duration_min);
                $result = $wa->sendToPhone($teacherPhone, $msg);
                $this->logResult("trial_reminder_{$key}_teacher", $teacherPhone, $msg, $result->success, $result->externalId, $result->errorBody, $session->id, 'teacher_id', $teacher->id);
            }
        }
    }

    private function studentMessage(string $key, string $student, string $teacher, string $time, string $zoomUrl): string
    {
        $zoomLine = $zoomUrl ? "\n🔗 *Join Now:* {$zoomUrl}" : '';

        return match ($key) {
            '2h' => trim(implode("\n", [
                '⏰ *Reminder: Trial Class in 2 Hours*',
                '',
                "Assalamu Alaikum *{$student}*,",
                '',
                "Your trial class with *{$teacher}* starts in *2 hours* at *{$time}*.",
                $zoomLine,
                '',
                'Please prepare your device and test your internet connection. 📶',
                '_Alrayan Academy_',
            ])),
            '5min' => trim(implode("\n", [
                '🚀 *Starting in 5 Minutes!*',
                '',
                "*{$student}*, your trial class is about to begin!",
                $zoomLine,
                '',
                'Get ready and join now! 🌟',
                '_Alrayan Academy_',
            ])),
            'now' => trim(implode("\n", [
                '🟢 *Your Trial Class is Starting Now!*',
                '',
                "Assalamu Alaikum *{$student}*,",
                '',
                "Click below to join your class with *{$teacher}*:",
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
            '2h' => trim(implode("\n", [
                '⏰ *Reminder: Trial Session in 2 Hours*',
                '',
                "Assalamu Alaikum *{$teacher}*,",
                '',
                "You have a trial session with *{$student}* in *2 hours* at *{$time}* ({$duration} min).",
                $zoomLine,
                '',
                'Please prepare your materials. ✅',
                '_Alrayan Academy_',
            ])),
            '5min' => trim(implode("\n", [
                '📢 *Trial Session in 5 Minutes*',
                '',
                "*{$teacher}*, your session with *{$student}* starts in 5 minutes!",
                $zoomLine,
                '_Alrayan Academy_',
            ])),
            'now' => trim(implode("\n", [
                '🟢 *Trial Session Starting Now*',
                '',
                "Assalamu Alaikum *{$teacher}*,",
                '',
                "Your session with *{$student}* is starting now. Please open Zoom.",
                $zoomLine,
                '_Alrayan Academy_',
            ])),
            default => '',
        };
    }

    private function logResult(
        string $templateKey,
        string $phone,
        string $message,
        bool   $success,
        ?string $externalId,
        ?string $error,
        int    $sessionId,
        string $recipientKey,
        int    $recipientId,
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
