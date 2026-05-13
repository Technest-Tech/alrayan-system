<?php

namespace Database\Factories\System;

use App\Models\System\WassenderLog;
use Illuminate\Database\Eloquent\Factories\Factory;

class WassenderLogFactory extends Factory
{
    protected $model = WassenderLog::class;

    public function definition(): array
    {
        $status = $this->faker->randomElement(['sent', 'sent', 'sent', 'failed']);
        return [
            'template_key'      => $this->faker->randomElement(['session_reminder_student', 'payment_due_soon', 'welcome_student']),
            'rendered_message'  => $this->faker->sentence(),
            'status'            => $status,
            'attempt_count'     => $status === 'sent' ? 1 : rand(1, 3),
            'sent_at'           => $status === 'sent' ? $this->faker->dateTimeBetween('-30 days', 'now') : null,
            'payload'           => ['variables' => []],
        ];
    }

    public function sent(): static   { return $this->state(['status' => 'sent', 'sent_at' => now()]); }
    public function failed(): static { return $this->state(['status' => 'failed', 'attempt_count' => 3]); }
    public function dead(): static   { return $this->state(['status' => 'dead', 'attempt_count' => 3]); }
}
