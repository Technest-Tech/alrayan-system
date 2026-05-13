<?php

namespace Database\Factories\System;

use App\Models\System\MessageTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

class MessageTemplateFactory extends Factory
{
    protected $model = MessageTemplate::class;

    public function definition(): array
    {
        return [
            'key'                 => $this->faker->unique()->slug(2),
            'channel'             => 'whatsapp',
            'label'               => $this->faker->sentence(3),
            'body'                => 'Hello {student_name}, this is a test message.',
            'available_variables' => ['student_name'],
            'is_active'           => true,
        ];
    }
}
