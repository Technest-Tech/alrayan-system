<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class PaymentRowResource extends JsonResource
{
    public function toArray($request): array
    {
        $student = $this->student;
        $teacher = optional($student?->assignedTeacher?->user);

        return [
            'package_id'           => $this->id,
            'student_id'           => $student?->id,
            'student_name'         => $student?->name,
            'phone'                => $student?->guardian?->whatsapp,
            'teacher_name'         => $teacher->name,
            'payment_status'       => $this->status,
            'package_number'       => $this->package_number,
            'package_hours'        => $this->package_hours,
            'consumed_hours'       => $this->consumed_hours,
            'tariff_at_time'       => $this->tariff_at_time,
            'currency'             => $this->currency,
            'notes'                => $this->notes,
            'paid_at'              => $this->paid_at?->toDateString(),
            'needs_reconfirmation' => $this->needs_reconfirmation,
        ];
    }
}
