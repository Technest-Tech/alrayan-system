<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class LessonEvaluationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'label'      => $this->label,
            'sort_order' => $this->sort_order,
        ];
    }
}
