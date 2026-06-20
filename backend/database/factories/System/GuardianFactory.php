<?php

namespace Database\Factories\System;

use App\Models\System\Guardian;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class GuardianFactory extends Factory
{
    protected $model = Guardian::class;

    public function definition(): array
    {
        return [
            'name'     => $this->faker->name(),
            'whatsapp' => '+1' . $this->faker->numerify('##########'),
        ];
    }

    /**
     * Create and link a real parent `users` row (role=parent).
     */
    public function withUser(): static
    {
        return $this->afterCreating(function (Guardian $guardian) {
            if ($guardian->user_id) {
                return;
            }

            $user = User::factory()->parent()->create([
                'name'     => $guardian->name,
                'whatsapp' => $guardian->whatsapp,
            ]);

            $guardian->forceFill(['user_id' => $user->id])->saveQuietly();
        });
    }
}
