<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MakeupRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'original_session_id'    => $this->original_session_id,
            'requested_by_user_id'   => $this->requested_by_user_id,
            'proposed_start_at'      => $this->proposed_start_at?->toIso8601String(),
            'proposed_duration_min'  => $this->proposed_duration_min,
            'reason'                 => $this->reason,
            'status'                 => $this->status,
            'review_note'            => $this->review_note,
            'reviewed_at'            => $this->reviewed_at?->toIso8601String(),
            'makeup_session_id'      => $this->makeup_session_id,
            'original_session'       => $this->whenLoaded('originalSession', fn () =>
                $this->originalSession ? new SessionResource($this->originalSession) : null
            ),
            'makeup_session'         => $this->whenLoaded('makeupSession', fn () =>
                $this->makeupSession ? new SessionResource($this->makeupSession) : null
            ),
        ];
    }
}
