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
            'level'                 => $this->level,
            'age_group'             => $this->age_group,
            'active_student_count'  => (int) ($this->active_student_count ?? 0),
            'paused_student_count'  => (int) ($this->paused_student_count ?? 0),
            'total_student_count'   => (int) ($this->total_student_count ?? 0),
            'teacher_count'         => (int) ($this->teacher_count ?? 0),
        ];
    }
}
