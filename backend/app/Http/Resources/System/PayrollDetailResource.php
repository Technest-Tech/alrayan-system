<?php

namespace App\Http\Resources\System;

class PayrollDetailResource extends PayrollResource
{
    public function toArray($request): array
    {
        return array_merge(parent::toArray($request), [
            'rejection_reason' => $this->rejection_reason,
            'rejected_at'      => $this->rejected_at?->toISOString(),
            'snapshot'         => $this->snapshot,
            'adjustments'      => PayrollAdjustmentResource::collection($this->whenLoaded('adjustments')),
            'approver'         => $this->whenLoaded('approver', fn() => [
                'id'   => $this->approver->id,
                'name' => $this->approver->name,
            ]),
        ]);
    }
}
