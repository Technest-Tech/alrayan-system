<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentTimelineEntryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->id,
            'event_type'    => $this->event_type,
            'payload'       => $this->payload,
            'actor_user_id' => $this->actor_user_id,
            'actor_name'    => optional($this->actor)->name,
            'created_at'    => $this->created_at,
        ];
    }
}
