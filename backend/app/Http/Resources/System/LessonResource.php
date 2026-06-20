<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                   => $this->id,
            'package_id'           => $this->package_id,
            'schedule_id'          => $this->schedule_id,
            'teacher_id'           => $this->teacher_id,
            'student_id'           => $this->student_id,
            'subject_id'           => $this->subject_id,
            'evaluation_id'        => $this->evaluation_id,
            'added_by'             => $this->added_by,
            'scheduled_at'         => $this->scheduled_at,
            'duration_minutes'     => $this->duration_minutes,
            'status'               => $this->status,
            'session_number_hours' => $this->session_number_hours !== null
                ? (float) $this->session_number_hours
                : null,
            'content'              => $this->content,
            'notes'                => $this->notes,
            'homework'             => $this->homework,
            'souvenir_image'       => $this->souvenir_image,
            'subject_details'      => $this->subject_details,

            'teacher'    => $this->whenLoaded('teacher', fn() => $this->teacher ? [
                'id'   => $this->teacher->id,
                'name' => optional($this->teacher->user)->name,
            ] : null),

            'student'    => $this->whenLoaded('student', fn() => $this->student ? [
                'id'   => $this->student->id,
                'name' => $this->student->name,
            ] : null),

            'subject'    => $this->whenLoaded('subject', fn() =>
                $this->subject ? new LessonSubjectResource($this->subject) : null
            ),

            'evaluation' => $this->whenLoaded('evaluation', fn() =>
                $this->evaluation ? new LessonEvaluationResource($this->evaluation) : null
            ),

            'package'    => $this->whenLoaded('package', fn() =>
                $this->package ? new StudentPackageResource($this->package) : null
            ),

            // Per-package consumption. A boundary lesson has >1 row (split across packages).
            'allocations' => $this->whenLoaded('allocations', fn() =>
                $this->allocations->map(fn($a) => [
                    'package_id'       => $a->package_id,
                    'package_number'   => optional($a->package)->package_number,
                    'hours'            => (float) $a->hours,
                    'cumulative_hours' => (float) $a->cumulative_hours,
                ])->values()
            ),

            'added_by_name' => $this->whenLoaded('addedBy', fn() =>
                optional($this->addedBy)->name
            ),
        ];
    }
}
