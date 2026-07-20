<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class QcCategoryItemResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'               => $this->id,
            'category_id'      => $this->category_id,
            'label'            => $this->label,
            'penalty'          => (int) $this->penalty,
            'special_rule_key' => $this->special_rule_key,
            'sort_order'       => $this->sort_order,
            'is_active'        => (bool) $this->is_active,
        ];
    }
}
