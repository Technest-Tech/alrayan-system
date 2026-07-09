<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class PayrollResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                    => $this->id,
            // teacher_id is nullOnDelete: a deleted teacher leaves the record with no teacher.
            'teacher'               => $this->whenLoaded('teacher', fn() => $this->teacher ? [
                'id'   => $this->teacher->id,
                'name' => $this->teacher->user?->name,
            ] : null),
            'period_year'           => $this->period_year,
            'period_month'          => $this->period_month,
            'total_sessions'        => $this->total_sessions,
            'total_minutes'         => $this->total_minutes,
            'breakdown_by_duration' => $this->breakdown_by_duration,
            'base_salary_minor'     => $this->base_salary_minor,
            'bonuses_minor'         => $this->bonuses_minor,
            'deductions_minor'      => $this->deductions_minor,
            'net_salary_minor'      => $this->net_salary_minor,
            'status'                => $this->status,
            'approved_at'           => $this->approved_at?->toISOString(),
            'transferred_at'        => $this->transferred_at?->toISOString(),
            'transfer_reference'    => $this->transfer_reference,
            'created_at'            => $this->created_at?->toISOString(),
        ];
    }
}
