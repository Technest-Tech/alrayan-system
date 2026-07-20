<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class QcEvaluationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                   => $this->id,
            'teacher_id'           => $this->teacher_id,
            'teacher_name'         => $this->whenLoaded('teacher', fn () => $this->teacher?->user?->name),
            'student_id'           => $this->student_id,
            'student_name'         => $this->whenLoaded('student', fn () => $this->student?->name),
            'quality_manager_id'   => $this->quality_manager_id,
            'quality_manager_name' => $this->whenLoaded('qualityManager', fn () => $this->qualityManager?->name),
            'duration_minutes'     => (int) $this->duration_minutes,
            'score'                => (float) $this->score,
            'general_notes'        => $this->general_notes,
            'evaluated_at'         => $this->evaluated_at?->toISOString(),
            'created_at'           => $this->created_at?->toISOString(),
            'updated_at'           => $this->updated_at?->toISOString(),
        ];
    }
}
