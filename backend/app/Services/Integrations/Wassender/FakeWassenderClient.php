<?php

namespace App\Services\Integrations\Wassender;

use App\Models\System\WhatsAppGroup;
use Illuminate\Support\Str;

// Does not extend WassenderClient — no real HTTP needed
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

    public function testConnection(WhatsAppGroup $group): WassenderSendResult
    {
        return WassenderSendResult::sent('fake_test_' . Str::uuid());
    }
}
