<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class WalletTransactionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                  => $this->id,
            'student_id'          => $this->student_id,
            'amount_minor'        => $this->amount_minor,
            'currency'            => $this->currency,
            'source'              => $this->source,
            'note'                => $this->note,
            'balance_after_minor' => $this->balance_after_minor,
            'created_at'          => $this->created_at?->toISOString(),
        ];
    }
}
