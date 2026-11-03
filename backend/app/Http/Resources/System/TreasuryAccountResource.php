<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The controller sets the computed figures on the model before wrapping it:
 * balance_minor, and optionally month_in_minor / month_out_minor.
 */
class TreasuryAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'name'                  => $this->name,
            'type'                  => $this->type,
            'currency'              => $this->currency,
            'identifier'            => $this->identifier,
            'notes'                 => $this->notes,
            'opening_balance_minor' => $this->opening_balance_minor,
            'opening_date'          => $this->opening_date?->toDateString(),
            'is_active'             => $this->is_active,
            'balance_minor'         => $this->balance_minor,
            'month_in_minor'        => $this->month_in_minor ?? 0,
            'month_out_minor'       => $this->month_out_minor ?? 0,
            'transactions_count'    => $this->whenCounted('transactions'),
        ];
    }
}
