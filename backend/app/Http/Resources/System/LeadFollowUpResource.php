<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class LeadFollowUpResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'               => $this->id,
            'lead_id'          => $this->lead_id,
            'actor_user_id'    => $this->actor_user_id,
            'actor_name'       => $this->actor?->name,
            'due_at'           => $this->due_at?->toISOString(),
            'action'           => $this->action,
            'notes'            => $this->notes,
            'completed_at'     => $this->completed_at?->toISOString(),
            'completion_notes' => $this->completion_notes,
            'created_at'       => $this->created_at?->toISOString(),
        ];
    }
}
