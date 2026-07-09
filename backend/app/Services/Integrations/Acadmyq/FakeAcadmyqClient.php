<?php

namespace App\Services\Integrations\Acadmyq;

use Illuminate\Support\Str;

// Does not extend the real client's constructor — no HTTP in fake mode.
class FakeAcadmyqClient extends AcadmyqClient
{
    public function __construct()
    {
        // Intentionally skip parent constructor — no HTTP client needed in fake mode
    }

    public function sendText(string $to, string $text, string $idempotencyKey): WhatsAppSendResult
    {
        return WhatsAppSendResult::accepted('fake_' . Str::uuid());
    }

    public function sendImage(string $to, string $imageUrl, ?string $caption, string $idempotencyKey): WhatsAppSendResult
    {
        return WhatsAppSendResult::accepted('fake_' . Str::uuid());
    }

    public function checkNumber(string $phone): ?bool
    {
        return true;
    }

    public function status(): array
    {
        return ['status' => 'CONNECTED', 'connected' => true];
    }
}
