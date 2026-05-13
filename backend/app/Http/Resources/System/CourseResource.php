<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                    => $this->id,
            'name'                  => $this->title,
            'slug'                  => $this->slug,
            'description'           => $this->short_description,
            'is_active_for_system'  => (bool) $this->is_active_for_system,
            'active_student_count'  => (int) ($this->active_student_count ?? 0),
        ];
    }
}
