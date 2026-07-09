<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class WhatsAppSendLogResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                  => $this->id,
            'recipient_phone'     => $this->recipient_phone,
            'kind'                => $this->kind,
            'body'                => $this->body,
            'body_preview'        => $this->body ? Str::limit($this->body, 120) : null,
            'image_url'           => $this->image_url,
            'caption'             => $this->caption,
            'idempotency_key'     => $this->idempotency_key,
            'status'              => $this->status,
            'provider_message_id' => $this->provider_message_id,
            'http_status'         => $this->http_status,
            'error'               => $this->error,
            'attempt_count'       => $this->attempt_count,
            'created_at'          => $this->created_at?->toISOString(),
            'updated_at'          => $this->updated_at?->toISOString(),
        ];
    }
}
