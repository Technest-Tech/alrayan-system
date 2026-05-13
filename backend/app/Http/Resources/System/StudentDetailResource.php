<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentDetailResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                    => $this->id,
            'name'                  => $this->name,
            'email'                 => $this->email,
            'phone'                 => $this->phone,
            'whatsapp'              => $this->whatsapp,
            'country'               => $this->country,
            'timezone'              => $this->timezone,
            'age_category'          => $this->age_category,
            'parent_name'           => $this->parent_name,
            'parent_phone'          => $this->parent_phone,
            'parent_whatsapp'       => $this->parent_whatsapp,
            'parent_email'          => $this->parent_email,
            'course'                => $this->whenLoaded('course', fn() => [
                'id'   => $this->course->id,
                'name' => $this->course->title,
            ]),
            'assigned_teacher'      => $this->whenLoaded('assignedTeacher', fn() => [
                'id'   => $this->assignedTeacher->id,
                'name' => optional($this->assignedTeacher->user)->name,
            ]),
            'status'                => $this->status,
            'sessions_per_month'    => $this->sessions_per_month,
            'session_duration_min'  => $this->session_duration_min,
            'currency'              => $this->currency,
            'monthly_price_minor'   => $this->monthly_price_minor,
            'custom_discount_pct'   => $this->custom_discount_pct,
            'wallet_balance_minor'  => $this->wallet_balance_minor,
            'wallet_currency'       => $this->wallet_currency,
            'source'                => $this->source,
            'trial_booking_id'      => $this->trial_booking_id,
            'whatsapp_group_id'     => $this->whatsapp_group_id,
            'whatsapp_group_link'   => $this->whatsapp_group_link,
            'whatsapp_group_status' => $this->whatsapp_group_status,
            'enrolled_at'           => $this->enrolled_at,
            'paused_at'             => $this->paused_at,
            'suspended_at'          => $this->suspended_at,
            'cancelled_at'          => $this->cancelled_at,
            'cancellation_reason'   => $this->cancellation_reason,
            'cancellation_notes'    => $this->cancellation_notes,
            'siblings'              => $this->whenLoaded('siblings', fn() =>
                $this->siblings->map(fn($sib) => [
                    'id'           => $sib->id,
                    'name'         => $sib->name,
                    'discount_pct' => $sib->pivot->discount_pct,
                    'course'       => optional($sib->course)->title,
                    'teacher_name' => optional(optional($sib->assignedTeacher)->user)->name,
                ])
            ),
            'timeline'  => StudentTimelineEntryResource::collection($this->whenLoaded('timeline')),
            'notes'     => StudentNoteResource::collection($this->whenLoaded('notes')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
