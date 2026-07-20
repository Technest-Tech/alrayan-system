<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class QcSpecialRuleResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'        => $this->id,
            'rule_key'  => $this->rule_key,
            'rule_type' => $this->rule_type,
            'label'     => $this->label,
            'cap_value' => (int) $this->cap_value,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
