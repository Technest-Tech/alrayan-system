<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentPackageResource extends JsonResource
{
    public function toArray($request): array
    {
        // Pricing is finance-only. Teachers (and students) must never receive the package tariff,
        // even in the raw payload — so it's stripped from the response for those roles.
        $hidePricing = in_array($request->user()?->role, ['teacher', 'student'], true);

        return [
            'id'                   => $this->id,
            'student_id'           => $this->student_id,
            'package_number'       => $this->package_number,
            'package_hours'        => $this->package_hours,
            'tariff_at_time'       => $hidePricing ? null : $this->tariff_at_time,
            'currency'             => $this->currency,
            'status'               => $this->status,
            'needs_reconfirmation' => $this->needs_reconfirmation,
            'paid_at'              => $this->paid_at?->toDateString(),
            'notes'                => $this->notes,
            'consumed_hours'       => $this->consumed_hours,
            'lessons_count'        => $this->whenCounted('lessons'),
        ];
    }
}
