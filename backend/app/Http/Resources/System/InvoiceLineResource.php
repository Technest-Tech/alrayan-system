<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceLineResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                   => $this->id,
            'description'          => $this->description,
            'kind'                 => $this->kind,
            'quantity'             => $this->quantity,
            'session_duration_min' => $this->session_duration_min,
            'unit_price_minor'     => $this->unit_price_minor,
            'line_total_minor'     => $this->line_total_minor,
            'source_invoice_id'    => $this->source_invoice_id,
        ];
    }
}
