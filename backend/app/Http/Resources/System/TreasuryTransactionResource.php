<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TreasuryTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'account'        => [
                'id'       => $this->account?->id,
                'name'     => $this->account?->name,
                'currency' => $this->account?->currency,
            ],
            'direction'      => $this->direction,
            'kind'           => $this->kind,
            'amount_minor'   => $this->amount_minor,
            'occurred_on'    => $this->occurred_on?->toDateString(),
            'description'    => $this->description,
            'counterparty'   => $this->counterparty,
            'reference'      => $this->reference,
            'expense_id'     => $this->expense_id,
            'category'       => $this->expense?->category?->name,
            'transfer_group' => $this->transfer_group,
            'source_type'    => $this->source_type,
            'source_id'      => $this->source_id,
            // Only on an account's statement, where a running balance means something.
            'balance_after_minor' => $this->when(
                isset($this->resource->running_total),
                fn () => $this->account->opening_balance_minor + (int) $this->resource->running_total,
            ),
            'created_by'     => $this->createdBy?->name,
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}
