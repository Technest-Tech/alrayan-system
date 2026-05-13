<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class QualityLeaderboardResource extends JsonResource
{
    public function toArray($request): array
    {
        $reviews = $this->qualityReviews ?? collect();
        $latest  = $reviews->first();
        $trend   = $reviews->take(6)->pluck('overall_score')->reverse()->values()->toArray();

        return [
            'teacher' => [
                'id'   => $this->id,
                'name' => $this->user?->name,
                'user' => $this->whenLoaded('user', fn() => [
                    'id'   => $this->user->id,
                    'name' => $this->user->name,
                ]),
            ],
            'latest_review' => $latest ? [
                'id'                         => $latest->id,
                'period_year'                => $latest->period_year,
                'period_month'               => $latest->period_month,
                'source'                     => $latest->source,
                'attendance_score'           => $latest->attendance_score,
                'reports_score'              => $latest->reports_score,
                'retention_score'            => $latest->retention_score,
                'punctuality_score'          => $latest->punctuality_score,
                'overall_score'              => $latest->overall_score,
                'bonus_recommendation_minor' => $latest->bonus_recommendation_minor,
            ] : null,
            'trend' => $trend,
        ];
    }
}
