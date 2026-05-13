<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                      => $this->id,
            'name'                    => $this->name,
            'email'                   => $this->email,
            'phone'                   => $this->phone,
            'whatsapp'                => $this->whatsapp,
            'country'                 => $this->country,
            'source'                  => $this->source,
            'source_detail'           => $this->source_detail,
            'status'                  => $this->status,
            'lost_reason'             => $this->lost_reason,
            'lost_notes'              => $this->lost_notes,
            'assigned_supervisor_id'  => $this->assigned_supervisor_id,
            'supervisor_name'         => $this->supervisor?->name,
            'trial_booking_id'        => $this->trial_booking_id,
            'converted_to_student_id' => $this->converted_to_student_id,
            'course_interest'         => $this->whenLoaded('courseInterest', fn() => [
                'id'   => $this->courseInterest->id,
                'name' => $this->courseInterest->name,
            ]),
            'follow_ups_count'        => $this->when(isset($this->follow_ups_count), $this->follow_ups_count),
            'pending_follow_ups_count'=> $this->when(isset($this->pending_follow_ups_count), $this->pending_follow_ups_count),
            'created_at'              => $this->created_at?->toISOString(),
            'updated_at'              => $this->updated_at?->toISOString(),
        ];
    }
}
