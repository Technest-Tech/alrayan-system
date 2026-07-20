<?php

namespace Database\Factories\System;

use App\Models\System\QcEvaluation;
use Illuminate\Database\Eloquent\Factories\Factory;

class QcEvaluationFactory extends Factory
{
    protected $model = QcEvaluation::class;

    public function definition(): array
    {
        return [
            'duration_minutes' => $this->faker->randomElement([10, 15, 20, 30]),
            'score'            => $this->faker->numberBetween(70, 100),
            'general_notes'    => $this->faker->optional()->sentence(),
            'evaluated_at'     => $this->faker->dateTimeBetween('-2 months', 'now'),
        ];
    }
}
