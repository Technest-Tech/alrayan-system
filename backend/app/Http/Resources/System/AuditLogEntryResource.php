<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'at'           => $this->created_at?->toIso8601String(),
            'source'       => $this->source ?? 'audit',
            'actor'        => $this->actor_name ?? ($this['causer']?->name ?? 'System'),
            'action'       => $this->event ?? $this->action,
            'target_type'  => $this->target_type ?? ($this['subject_type'] ? class_basename($this['subject_type']) : null),
            'target_id'    => $this->target_id ?? $this['subject_id'],
            'target_label' => $this->target_label ?? null,
            'diff'         => $this->payload ?? $this->properties ?? null,
        ];
    }
}
