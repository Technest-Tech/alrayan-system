<?php

namespace Database\Factories\System;

use App\Models\System\LeadFollowUp;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeadFollowUpFactory extends Factory
{
    protected $model = LeadFollowUp::class;

    public function definition(): array
    {
        return [
            'due_at' => $this->faker->dateTimeBetween('-7 days', '+7 days'),
            'action' => $this->faker->randomElement(['Call back', 'Send WhatsApp', 'Follow up trial', 'Schedule demo']),
            'notes'  => $this->faker->optional()->sentence(),
        ];
    }

    public function completed(): static
    {
        return $this->state([
            'completed_at'     => now()->subHours(rand(1, 48)),
            'completion_notes' => $this->faker->sentence(),
        ]);
    }
}
