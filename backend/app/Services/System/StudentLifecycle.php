<?php

namespace App\Services\System;

use App\Events\System\StudentStatusChanged;
use App\Models\System\Session;
use App\Models\System\Student;
use App\Models\System\StudentTimelineEntry;
use App\Models\System\WassenderLog;
use Illuminate\Support\Facades\DB;

class StudentLifecycle
{
    public const ALLOWED = [
        'trial'     => ['active', 'cancelled'],
        'active'    => ['paused', 'suspended', 'cancelled'],
        'paused'    => ['active', 'cancelled'],
        'suspended' => ['active', 'cancelled'],
        'cancelled' => [],
    ];

    public function can(Student $student, string $next): bool
    {
        return in_array($next, self::ALLOWED[$student->status] ?? [], true);
    }

    public function transition(Student $student, string $next, array $context = []): Student
    {
        abort_unless($this->can($student, $next), 422, "Invalid transition from {$student->status} to {$next}");

        // Enforce: when graduating a student out of trial (trial → active),
        // require that at least one of their session reports has been sent
        // successfully via WhatsApp.
        if ($student->status === 'trial' && $next === 'active') {
            $sessionIds = Session::where('student_id', $student->id)
                ->whereHas('report')
                ->pluck('id');

            $reportSent = $sessionIds->isNotEmpty()
                && WassenderLog::where('status', 'sent')
                    ->where('template_key', 'like', 'session_report.%')
                    ->whereIn('payload->session_id', $sessionIds->all())
                    ->exists();

            abort_unless(
                $reportSent,
                422,
                'Cannot move this student out of trial until the trial session report has been sent successfully on WhatsApp.'
            );
        }

        DB::transaction(function () use ($student, $next, $context) {
            $old = $student->status;
            $student->status = $next;
            $timestampCol = match($next) {
                'active' => 'enrolled_at',
                default  => $next . '_at',
            };
            if (!$student->{$timestampCol}) {
                $student->{$timestampCol} = now();
            }
            if ($next === 'cancelled') {
                $student->cancellation_reason = $context['reason'] ?? null;
                $student->cancellation_notes  = $context['notes'] ?? null;
            }
            $student->save();

            StudentTimelineEntry::create([
                'student_id'    => $student->id,
                'actor_user_id' => auth()->id(),
                'event_type'    => 'status_changed',
                'payload'       => ['old' => $old, 'new' => $next, 'context' => $context],
            ]);

            AuditLog::record('student.status_changed', $student, ['old' => $old, 'new' => $next, 'context' => $context]);

            event(new StudentStatusChanged($student, $old, $next));
        });

        return $student->fresh();
    }
}
