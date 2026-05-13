<?php

namespace App\Services\System;

use App\Events\System\StudentStatusChanged;
use App\Models\System\Student;
use App\Models\System\StudentTimelineEntry;
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

        DB::transaction(function () use ($student, $next, $context) {
            $old = $student->status;
            $student->status = $next;
            if (!$student->{$next . '_at'}) {
                $student->{$next . '_at'} = now();
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

            AuditLog::record(
                action: 'student.status_changed',
                subject: $student,
                meta: ['old' => $old, 'new' => $next, 'context' => $context],
            );

            event(new StudentStatusChanged($student, $old, $next));
        });

        return $student->fresh();
    }
}
