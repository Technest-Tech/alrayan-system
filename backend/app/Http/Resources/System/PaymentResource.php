<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'invoice_id'   => $this->invoice_id,
            'amount_minor' => $this->amount_minor,
            'currency'     => $this->currency,
            'method'       => $this->method,
            'reference'    => $this->reference,
            'paid_at'      => $this->paid_at?->toISOString(),
            'recorded_by'  => $this->whenLoaded('recordedBy', fn() => $this->recordedBy?->name),
        ];
    }
}
