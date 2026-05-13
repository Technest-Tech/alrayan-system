<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class QualityReviewResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                         => $this->id,
            'teacher_id'                 => $this->teacher_id,
            'period_year'                => $this->period_year,
            'period_month'               => $this->period_month,
            'source'                     => $this->source,
            'attendance_score'           => $this->attendance_score,
            'reports_score'              => $this->reports_score,
            'retention_score'            => $this->retention_score,
            'punctuality_score'          => $this->punctuality_score,
            'overall_score'              => $this->overall_score,
            'inputs'                     => $this->inputs,
            'notes'                      => $this->notes,
            'bonus_recommendation_minor' => $this->bonus_recommendation_minor,
            'reviewer'                   => $this->whenLoaded('reviewer', fn() => [
                'id'   => $this->reviewer->id,
                'name' => $this->reviewer->name,
            ]),
            'created_at'                 => $this->created_at?->toISOString(),
        ];
    }
}
