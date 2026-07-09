<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'session_id'         => $this->session_id,
            'teacher_id'         => $this->teacher_id,
            'student_id'         => $this->student_id,
            'covered_text'       => $this->covered_text,
            'performance'        => $this->performance,
            'homework_text'      => $this->homework_text,
            'next_session_notes' => $this->next_session_notes,
            'submitted_at'       => $this->submitted_at?->toIso8601String(),
            'student'            => $this->whenLoaded('student', fn () => [
                'id'   => $this->student->id,
                'name' => $this->student->name,
            ]),
            // teacher_id is nullOnDelete: a deleted teacher leaves the record with no teacher.
            'teacher'            => $this->whenLoaded('teacher', fn () => $this->teacher ? [
                'id'   => $this->teacher->id,
                'name' => $this->teacher->user?->name,
            ] : null),
            'session'            => $this->whenLoaded('session', fn () =>
                $this->session ? new SessionResource($this->session) : null
            ),
        ];
    }
}
