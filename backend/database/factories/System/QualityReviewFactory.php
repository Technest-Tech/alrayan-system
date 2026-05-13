<?php

namespace Database\Factories\System;

use App\Models\System\QualityReview;
use App\Models\System\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

class QualityReviewFactory extends Factory
{
    protected $model = QualityReview::class;

    public function definition(): array
    {
        $scores = [
            'attendance_score'  => $this->faker->numberBetween(60, 100),
            'reports_score'     => $this->faker->numberBetween(60, 100),
            'retention_score'   => $this->faker->numberBetween(70, 100),
            'punctuality_score' => $this->faker->numberBetween(70, 100),
        ];
        $overall = (int) round(
            ($scores['attendance_score'] * 30
            + $scores['reports_score'] * 30
            + $scores['retention_score'] * 25
            + $scores['punctuality_score'] * 15) / 100
        );
        return array_merge($scores, [
            'teacher_id'                 => Teacher::factory(),
            'period_year'                => 2026,
            'period_month'               => now()->month,
            'reviewer_user_id'           => null,
            'source'                     => 'auto',
            'overall_score'              => $overall,
            'inputs'                     => null,
            'notes'                      => null,
            'bonus_recommendation_minor' => $overall >= 90 ? 50000 : 0,
        ]);
    }
}
