<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'category'     => [
                'id'   => $this->category?->id,
                'name' => $this->category?->name,
                'slug' => $this->category?->slug,
            ],
            'account'      => $this->account ? [
                'id'       => $this->account->id,
                'name'     => $this->account->name,
                'currency' => $this->account->currency,
            ] : null,
            'item'         => $this->item ? [
                'id'   => $this->item->id,
                'name' => $this->item->name,
                'type' => $this->item->type,
            ] : null,
            'period'       => $this->period,
            'amount_minor' => $this->amount_minor,
            'currency'     => $this->currency,
            'description'  => $this->description,
            'occurred_on'  => $this->occurred_on?->toDateString(),
            'attachments'  => $this->attachments ?? [],
            'created_by'   => $this->createdBy?->name,
            'created_at'   => $this->created_at?->toIso8601String(),
        ];
    }
}
