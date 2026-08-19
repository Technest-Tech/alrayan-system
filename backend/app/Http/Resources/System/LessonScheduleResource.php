<?php

namespace App\Http\Resources\System;

use App\Support\System\SubjectCatalog;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonScheduleResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'teacher_id' => $this->teacher_id,
            'student_id' => $this->student_id,
            'subject_id' => $this->subject_id,
            'subject_ids' => array_map('intval', $this->subject_ids ?? []),
            'subjects'   => app(SubjectCatalog::class)->expand($this->subject_ids),
            'recurrence' => $this->recurrence,
            'start_date' => $this->start_date,
            'is_active'  => $this->is_active,
            'created_at' => $this->created_at,

            'teacher' => $this->whenLoaded('teacher', fn() => $this->teacher ? [
                'id'   => $this->teacher->id,
                'name' => optional($this->teacher->user)->name,
            ] : null),

            'student' => $this->whenLoaded('student', fn() => $this->student ? [
                'id'   => $this->student->id,
                'name' => $this->student->name,
            ] : null),

            'subject' => $this->whenLoaded('subject', fn() =>
                $this->subject ? new LessonSubjectResource($this->subject) : null
            ),

            'slots' => $this->whenLoaded('slots', fn() =>
                $this->slots->map(fn($slot) => [
                    'id'               => $slot->id,
                    'day_of_week'      => $slot->day_of_week,
                    'start_time'       => $slot->start_time,
                    'duration_minutes' => $slot->duration_minutes,
                ])->values()
            ),
        ];
    }
}
