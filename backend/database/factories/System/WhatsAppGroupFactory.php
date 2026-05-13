<?php

namespace Database\Factories\System;

use App\Models\System\WhatsAppGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

class WhatsAppGroupFactory extends Factory
{
    protected $model = WhatsAppGroup::class;

    public function definition(): array
    {
        return [
            'type'        => $this->faker->randomElement(['student', 'teacher']),
            'invite_link' => 'https://chat.whatsapp.com/' . $this->faker->regexify('[A-Za-z0-9]{22}'),
            'status'      => 'active',
        ];
    }

    public function student(): static { return $this->state(['type' => 'student']); }
    public function teacher(): static { return $this->state(['type' => 'teacher']); }
    public function stopped(): static { return $this->state(['status' => 'stopped']); }
}
