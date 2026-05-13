<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class TeacherDetailResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                    => $this->id,
            'user_id'               => $this->user_id,
            'name'                  => optional($this->user)->name,
            'email'                 => optional($this->user)->email,
            'phone'                 => optional($this->user)->phone,
            'whatsapp'              => optional($this->user)->whatsapp,
            'qualifications'        => $this->qualifications,
            'teachable_course_ids'  => $this->teachable_course_ids ?? [],
            'payment_method'        => $this->payment_method,
            'per_minute_rate_30'    => $this->per_minute_rate_30,
            'per_minute_rate_45'    => $this->per_minute_rate_45,
            'per_minute_rate_60'    => $this->per_minute_rate_60,
            'is_active'             => $this->is_active,
            'last_login_at'         => optional($this->user)->last_login_at,
            'invite_pending'        => optional($this->user)->last_login_at === null,
            'availability'          => TeacherAvailabilityResource::collection($this->whenLoaded('availability')),
            'students'              => StudentResource::collection($this->whenLoaded('students')),
            'notes'                 => TeacherNoteResource::collection($this->whenLoaded('notes')),
            'created_at'            => $this->created_at,
            'deleted_at'            => $this->deleted_at,
        ];
    }
}
