<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class LeadDetailResource extends JsonResource
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
            'payload'                 => $this->payload,
            'assigned_supervisor_id'  => $this->assigned_supervisor_id,
            'supervisor'              => $this->whenLoaded('supervisor', fn() => [
                'id'   => $this->supervisor->id,
                'name' => $this->supervisor->name,
            ]),
            'trial_booking_id'        => $this->trial_booking_id,
            'converted_to_student_id' => $this->converted_to_student_id,
            'course_interest'         => $this->whenLoaded('courseInterest', fn() => [
                'id'   => $this->courseInterest->id,
                'name' => $this->courseInterest->name,
            ]),
            'follow_ups'              => LeadFollowUpResource::collection($this->whenLoaded('followUps')),
            'created_at'              => $this->created_at?->toISOString(),
            'updated_at'              => $this->updated_at?->toISOString(),
        ];
    }
}
