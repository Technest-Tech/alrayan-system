<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class WassenderLogResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                  => $this->id,
            'template_key'        => $this->template_key,
            'whatsapp_group_id'   => $this->whatsapp_group_id,
            'whatsapp_group'      => $this->whenLoaded('whatsappGroup', fn() => [
                'id'          => $this->whatsappGroup->id,
                'type'        => $this->whatsappGroup->type,
                'invite_link' => $this->whatsappGroup->invite_link,
                'linked_name' => $this->whatsappGroup->linkedStudent?->name
                              ?? $this->whatsappGroup->linkedTeacher?->user?->name,
            ]),
            'recipient_phone'     => $this->recipient_phone,
            'rendered_message'    => $this->rendered_message,
            'status'              => $this->status,
            'external_message_id' => $this->external_message_id,
            'attempt_count'       => $this->attempt_count,
            'error'               => $this->error,
            'payload'             => $this->payload,
            'sent_at'             => $this->sent_at?->toISOString(),
            'created_at'          => $this->created_at?->toISOString(),
        ];
    }
}
