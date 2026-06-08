<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceDetailResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                  => $this->id,
            'invoice_number'      => $this->invoice_number,
            'type'                => $this->type,
            'period_year'         => $this->period_year,
            'period_month'        => $this->period_month,
            'currency'            => $this->currency,
            'subtotal_minor'      => $this->subtotal_minor,
            'discount_minor'      => $this->discount_minor,
            'wallet_credit_minor' => $this->wallet_credit_minor,
            'total_minor'         => $this->total_minor,
            'status'              => $this->status,
            'issued_at'           => $this->issued_at?->toISOString(),
            'due_at'              => $this->due_at?->toISOString(),
            'paid_at'             => $this->paid_at?->toISOString(),
            'voided_at'           => $this->voided_at?->toISOString(),
            'voided_reason'       => $this->voided_reason,
            'snapshot'            => $this->snapshot,
            'student'             => $this->whenLoaded('student', fn() => [
                'id'       => $this->student->id,
                'name'     => $this->student->name,
                'email'    => $this->student->email,
                'currency' => $this->student->currency,
            ]),
            'lines'       => InvoiceLineResource::collection($this->whenLoaded('lines')),
            'payments'    => PaymentResource::collection($this->whenLoaded('payments')),
            'xpay_link' => $this->whenLoaded('xpayLink', fn() => $this->xpayLink ? [
                'iframe_url'       => $this->xpayLink->iframe_url,
                'transaction_uuid' => $this->xpayLink->transaction_uuid,
                'expires_at'       => $this->xpayLink->expires_at?->toISOString(),
                'is_active'        => $this->xpayLink->is_active,
            ] : null),
        ];
    }
}
