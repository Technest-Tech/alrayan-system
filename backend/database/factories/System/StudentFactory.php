<?php

namespace Database\Factories\System;

use App\Models\System\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'name'                 => $this->faker->name(),
            'email'                => $this->faker->safeEmail(),
            'phone'                => '+1' . $this->faker->numerify('##########'),
            'whatsapp'             => '+1' . $this->faker->numerify('##########'),
            'country'              => $this->faker->randomElement(['US', 'GB', 'CA', 'EG', 'SA', 'AE']),
            'timezone'             => $this->faker->randomElement(['America/New_York', 'Europe/London', 'Africa/Cairo', 'Asia/Riyadh']),
            'age_category'         => 'adult',
            'sessions_per_month'   => 8,
            'session_duration_min' => 30,
            'currency'             => 'USD',
            'monthly_price_minor'  => 2500,
            'custom_discount_pct'  => 0,
            'status'               => 'active',
            'source'               => 'manual',
        ];
    }

    public function trial(): static
    {
        return $this->state(['status' => 'trial']);
    }

    public function paused(): static
    {
        return $this->state(['status' => 'paused', 'paused_at' => now()]);
    }

    public function suspended(): static
    {
        return $this->state(['status' => 'suspended', 'suspended_at' => now()]);
    }

    public function cancelled(): static
    {
        return $this->state([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => 'Personal',
        ]);
    }

    public function child(): static
    {
        return $this->state([
            'age_category'   => 'child',
            'parent_name'    => $this->faker->name(),
            'parent_phone'   => '+1' . $this->faker->numerify('##########'),
            'parent_whatsapp'=> '+1' . $this->faker->numerify('##########'),
            'parent_email'   => $this->faker->safeEmail(),
        ]);
    }
}
