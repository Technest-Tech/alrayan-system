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
            'age'                     => $this->age,
            'gender'                  => $this->gender,
            'country'                 => $this->country,
            'city'                    => $this->city,
            'source'                  => $this->source,
            'source_detail'           => $this->source_detail,
            'platform'                => $this->platform,
            'platform_url'            => $this->platform_url,
            'priority'                => $this->priority ?? 'medium',
            'status'                  => $this->status,
            'lost_reason'             => $this->lost_reason,
            'lost_notes'              => $this->lost_notes,
            'notes'                   => $this->notes,
            'rejection_reason'        => $this->rejection_reason,
            'package_type'            => $this->package_type,
            'package_hours'           => $this->package_hours,
            'subscription_price'      => $this->subscription_price,
            'currency'                => $this->currency,
            'payment_method'          => $this->payment_method,
            'is_family_lead'          => (bool) $this->is_family_lead,
            'assigned_supervisor_id'  => $this->assigned_supervisor_id,
            'assigned_teacher_id'     => $this->whenLoaded('student', fn() => $this->student?->assigned_teacher_id),
            'supervisor_name'         => $this->supervisor?->name,
            'trial_booking_id'        => $this->trial_booking_id,
            'converted_to_student_id' => $this->converted_to_student_id,
            'course_interest'         => $this->whenLoaded('courseInterest', fn() => [
                'id'   => $this->courseInterest->id,
                'name' => $this->courseInterest->name,
            ]),
            'follow_ups_count'         => $this->when(isset($this->follow_ups_count), $this->follow_ups_count),
            'pending_follow_ups_count' => $this->when(isset($this->pending_follow_ups_count), $this->pending_follow_ups_count),
            'payload'                  => $this->payload,
            'created_at'               => $this->created_at?->toISOString(),
            'updated_at'               => $this->updated_at?->toISOString(),
        ];
    }
}
