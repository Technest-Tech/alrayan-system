<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class TeacherLeaveResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                   => $this->id,
            'teacher_id'           => $this->teacher_id,
            'teacher_name'         => optional($this->teacher?->user)->name,
            'start_date'           => $this->start_date?->toDateString(),
            'end_date'             => $this->end_date?->toDateString(),
            'reason'               => $this->reason,
            'status'               => $this->status,
            'reviewed_by_user_id'  => $this->reviewed_by_user_id,
            'reviewed_by_name'     => optional($this->reviewedBy)->name,
            'review_note'          => $this->review_note,
            'reviewed_at'          => $this->reviewed_at,
            'created_at'           => $this->created_at,
        ];
    }
}
