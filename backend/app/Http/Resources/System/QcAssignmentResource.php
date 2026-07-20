<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class QcAssignmentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                   => $this->id,
            'quality_manager_id'   => $this->quality_manager_id,
            'quality_manager_name' => $this->whenLoaded('qualityManager', fn () => $this->qualityManager?->name),
            'teacher_id'           => $this->teacher_id,
            'teacher_name'         => $this->whenLoaded('teacher', fn () => $this->teacher?->user?->name),
            'created_at'           => $this->created_at?->toISOString(),
        ];
    }
}
