<?php

namespace App\Services\Integrations\Wassender;

use App\Models\System\WhatsAppGroup;
use Illuminate\Support\Str;

class FakeWassenderClient extends WassenderClient
{
    public function __construct()
    {
        // Intentionally skip parent constructor — no HTTP client needed in fake mode
    }

    public function sendToGroup(WhatsAppGroup $group, string $message): WassenderSendResult
    {
        return WassenderSendResult::sent('fake_' . Str::uuid());
    }

    public function sendToPhone(string $phone, string $message): WassenderSendResult
    {
        return WassenderSendResult::sent('fake_' . Str::uuid());
    }

    public function sendText(string $to, string $text): WassenderSendResult
    {
        return WassenderSendResult::sent('fake_' . Str::uuid());
    }

    public function sendImage(string $to, string $imageUrl, ?string $caption = null): WassenderSendResult
    {
        return WassenderSendResult::sent('fake_' . Str::uuid());
    }

    public function sendDocument(string $to, string $documentUrl, string $fileName): WassenderSendResult
    {
        return WassenderSendResult::sent('fake_' . Str::uuid());
    }

    public function sendVideo(string $to, string $videoUrl, ?string $caption = null): WassenderSendResult
    {
        return WassenderSendResult::sent('fake_' . Str::uuid());
    }

    public function status(): WassenderSendResult
    {
        return WassenderSendResult::sent('fake_status');
    }

    public function testConnection(WhatsAppGroup $group): WassenderSendResult
    {
        return WassenderSendResult::sent('fake_test_' . Str::uuid());
    }
}
