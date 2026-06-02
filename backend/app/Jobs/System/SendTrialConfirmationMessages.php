<?php

namespace App\Jobs\System;

use App\Models\System\Session;
use App\Models\System\WassenderLog;
use App\Services\Integrations\Wassender\WassenderClient;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendTrialConfirmationMessages implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $backoff = 30;

    public function __construct(public int $sessionId) {}

    public function handle(WassenderClient $wa): void
    {
        $session = Session::with(['student', 'teacher.user'])->find($this->sessionId);

        if (!$session || $session->status === 'cancelled') return;

        $student = $session->student;
        $teacher = $session->teacher;

        if (!$student || !$teacher?->user) return;
        if ($student->status !== 'trial') return;

        $studentPhone  = preg_replace('/[\s\-]/', '', $student->whatsapp ?: $student->phone ?: '');
        $teacherPhone  = preg_replace('/[\s\-]/', '', $teacher->user->whatsapp ?: $teacher->user->phone ?: '');
        $teacherName   = $teacher->user->name;
        $studentName   = $student->name;
        $teacherZoom   = $session->zoom_link ?? $teacher->zoom_link ?? '';

        $sessionStart  = Carbon::parse($session->scheduled_start);
        $studentTz     = $student->timezone ?? 'UTC';
        $teacherTz     = $teacher->user->timezone ?? 'Africa/Cairo';

        $studentTime   = $sessionStart->copy()->setTimezone($studentTz)->format('l, d M Y \a\t g:i A T');
        $teacherTime   = $sessionStart->copy()->setTimezone($teacherTz)->format('l, d M Y \a\t g:i A T');
        $durationMin   = $session->duration_min;

        // ── Student confirmation ────────────────────────────────────────
        if ($studentPhone) {
            $zoomLine    = $session->zoom_join_url ? "\n🔗 *Zoom Link:* " . $session->zoom_join_url : '';
            $studentMsg  = implode("\n", [
                '🎉 *Trial Class Confirmed!*',
                '',
                "Assalamu Alaikum *{$studentName}*,",
                '',
                'Your free trial class has been successfully scheduled! Here are your details:',
                '',
                "📅 *Date & Time:* {$studentTime}",
                "👨‍🏫 *Teacher:* {$teacherName}",
                "⏱ *Duration:* {$durationMin} minutes",
                $zoomLine,
                '',
                'Please join 5 minutes early to test your connection. 📶',
                '',
                'See you soon! 🌟',
                '_Alrayan Academy_',
            ]);

            $result = $wa->sendToPhone($studentPhone, trim($studentMsg));
            $this->log('trial_confirmation_student', $studentPhone, trim($studentMsg), $result->success, $result->externalId, $result->errorBody, $session->id, 'student_id', $student->id);
        }

        // ── Teacher confirmation ────────────────────────────────────────
        if ($teacherPhone) {
            $zoomLine   = $session->zoom_start_url
                ? "\n🔗 *Your Zoom Link:* " . $session->zoom_start_url
                : ($teacherZoom ? "\n🔗 *Zoom Room:* {$teacherZoom}" : '');

            $teacherMsg = implode("\n", [
                '📋 *New Trial Class Assigned*',
                '',
                "Assalamu Alaikum *{$teacherName}*,",
                '',
                'A new trial session has been scheduled for you:',
                '',
                "👤 *Student:* {$studentName}",
                "📅 *Date & Time:* {$teacherTime}",
                "⏱ *Duration:* {$durationMin} minutes",
                $zoomLine,
                '',
                'Please be ready 5 minutes before the session starts. ✅',
                '',
                'Jazakum Allah Khayran 🌿',
                '_Alrayan Academy_',
            ]);

            $result = $wa->sendToPhone($teacherPhone, trim($teacherMsg));
            $this->log('trial_confirmation_teacher', $teacherPhone, trim($teacherMsg), $result->success, $result->externalId, $result->errorBody, $session->id, 'teacher_id', $teacher->id);
        }
    }

    private function log(
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
