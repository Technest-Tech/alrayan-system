<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class PayrollAdjustmentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'payroll_id'   => $this->payroll_id,
            'type'         => $this->type,
            'category'     => $this->category,
            'amount_minor' => $this->amount_minor,
            'reason'       => $this->reason,
            'added_by'     => $this->whenLoaded('addedBy', fn() => [
                'id'   => $this->addedBy->id,
                'name' => $this->addedBy->name,
            ]),
            'created_at'   => $this->created_at?->toISOString(),
        ];
    }
}
