<?php

namespace Database\Factories\System;

use App\Models\System\Teacher;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TeacherFactory extends Factory
{
    protected $model = Teacher::class;

    public function definition(): array
    {
        return [
            'user_id'                => User::factory(),
            'qualifications'         => $this->faker->sentence(8),
            'teachable_course_ids'   => [],
            'payment_method'         => $this->faker->randomElement(['vodafone_cash', 'instapay']),
            'payment_account_details'=> $this->faker->numerify('01#########'),
            'per_minute_rate_30'     => $this->faker->randomElement([240, 280, 300, 320]),
            'per_minute_rate_45'     => $this->faker->randomElement([240, 280, 300, 320]),
            'per_minute_rate_60'     => $this->faker->randomElement([240, 280, 300, 320]),
            'is_active'              => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
