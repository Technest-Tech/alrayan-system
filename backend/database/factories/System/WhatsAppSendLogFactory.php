<?php

namespace Database\Factories\System;

use App\Models\System\WhatsAppSendLog;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class WhatsAppSendLogFactory extends Factory
{
    protected $model = WhatsAppSendLog::class;

    public function definition(): array
    {
        return [
            'recipient_phone' => $this->faker->numerify('20##########'),
            'kind'            => WhatsAppSendLog::KIND_TEXT,
            'body'            => $this->faker->sentence(),
            'idempotency_key' => 'wa-' . Str::ulid(),
            'status'          => WhatsAppSendLog::STATUS_ACCEPTED,
            'provider_message_id' => 'msg_' . $this->faker->uuid(),
            'http_status'     => 202,
            'attempt_count'   => 1,
        ];
    }

    public function queued(): static
    {
        return $this->state([
            'status'              => WhatsAppSendLog::STATUS_QUEUED,
            'provider_message_id' => null,
            'http_status'         => null,
            'attempt_count'       => 0,
        ]);
    }

    public function duplicate(): static
    {
        return $this->state([
            'status'              => WhatsAppSendLog::STATUS_DUPLICATE,
            'provider_message_id' => null,
            'http_status'         => 200,
        ]);
    }

    public function failed(): static
    {
        return $this->state([
            'status'              => WhatsAppSendLog::STATUS_FAILED,
            'provider_message_id' => null,
            'http_status'         => 422,
            'error'               => 'invalid_request',
            'attempt_count'       => 1,
        ]);
    }

    public function image(): static
    {
        return $this->state([
            'kind'      => WhatsAppSendLog::KIND_IMAGE,
            'body'      => null,
            'image_url' => 'https://cdn.example.com/' . $this->faker->uuid() . '.png',
            'caption'   => $this->faker->sentence(3),
        ]);
    }
}
