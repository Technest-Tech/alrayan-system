<?php

namespace Database\Factories\System;

use App\Models\System\MakeupRequest;
use App\Models\System\Session;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MakeupRequestFactory extends Factory
{
    protected $model = MakeupRequest::class;

    public function definition(): array
    {
        return [
            'original_session_id'    => Session::factory()->cancelled(),
            'requested_by_user_id'   => User::factory(),
            'proposed_start_at'      => $this->faker->dateTimeBetween('+1 day', '+14 days'),
            'proposed_duration_min'  => $this->faker->randomElement([30, 45, 60]),
            'reason'                 => $this->faker->optional()->sentence(),
            'status'                 => 'pending',
            'reviewed_by_user_id'    => null,
            'review_note'            => null,
            'reviewed_at'            => null,
            'makeup_session_id'      => null,
        ];
    }

    public function approved(): static
    {
        return $this->state([
            'status'      => 'approved',
            'reviewed_at' => now(),
        ]);
    }

    public function denied(): static
    {
        return $this->state([
            'status'      => 'denied',
            'review_note' => $this->faker->sentence(),
            'reviewed_at' => now(),
        ]);
    }
}
