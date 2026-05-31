<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                   => $this->id,
            'name'                 => $this->name,
            'email'                => $this->email,
            'whatsapp'             => $this->whatsapp,
            'country'              => $this->country,
            'timezone'             => $this->timezone,
            'student_type'         => $this->student_type,
            'guardian'             => $this->whenLoaded('guardian', fn() => $this->guardian ? [
                'id'       => $this->guardian->id,
                'name'     => $this->guardian->name,
                'whatsapp' => $this->guardian->whatsapp,
            ] : null),
            'course'               => $this->whenLoaded('course', fn() => [
                'id'   => $this->course->id,
                'name' => $this->course->title,
            ]),
            'assigned_teacher'     => $this->whenLoaded('assignedTeacher', fn() => [
                'id'   => $this->assignedTeacher->id,
                'name' => optional($this->assignedTeacher->user)->name,
            ]),
            'status'               => $this->status,
            'sessions_per_month'   => $this->sessions_per_month,
            'session_duration_min' => $this->session_duration_min,
            'currency'             => $this->currency,
            'monthly_price_minor'  => $this->monthly_price_minor,
            'custom_discount_pct'  => $this->custom_discount_pct,
            'whatsapp_group_id'    => $this->whatsapp_group_id,
            'whatsapp_group_link'  => $this->whatsapp_group_link,
            'whatsapp_group_status'=> $this->whatsapp_group_status,
            'source'               => $this->source,
            'enrolled_at'          => $this->enrolled_at,
            'created_at'           => $this->created_at,
        ];
    }
}
