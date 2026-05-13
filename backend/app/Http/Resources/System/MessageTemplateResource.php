<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class MessageTemplateResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                  => $this->id,
            'key'                 => $this->key,
            'channel'             => $this->channel,
            'label'               => $this->label,
            'subject'             => $this->subject,
            'body'                => $this->body,
            'available_variables' => $this->available_variables,
            'example_values'      => $this->example_values,
            'is_active'           => $this->is_active,
            'updated_at'          => $this->updated_at?->toISOString(),
        ];
    }
}
