<?php

namespace App\Services\System;

use App\Models\System\Student;
use App\Models\System\StudentTimelineEntry;

class StudentTimelineRecorder
{
    public function record(Student $student, string $eventType, array $payload = []): void
    {
        StudentTimelineEntry::create([
            'student_id'    => $student->id,
            'actor_user_id' => auth()->id(),
            'event_type'    => $eventType,
            'payload'       => $payload,
        ]);
    }
}
