<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class LessonSubjectResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'fields'     => $this->fields,
            'sort_order' => $this->sort_order,
        ];
    }
}
