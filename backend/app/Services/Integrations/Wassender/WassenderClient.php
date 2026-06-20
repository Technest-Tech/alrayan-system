<?php

namespace App\Services\Integrations\Wassender;

use App\Models\System\WhatsAppGroup;
use Illuminate\Http\Client\Factory as HttpClient;

class WassenderClient
{
    public function __construct(
        private string $apiKey,
        private string $instanceId,
        private HttpClient $http,
    ) {}

    public function sendToGroup(WhatsAppGroup $group, string $message): WassenderSendResult
    {
        $res = $this->http
            ->withToken($this->apiKey)
            ->retry(3, 1500, throw: false)
            ->post("https://api.wassender.com/v1/instances/{$this->instanceId}/messages", [
                'type'         => 'text',
                'group_invite' => $group->invite_link,
                'message'      => $message,
            ]);

        if (!$res->successful()) {
            return WassenderSendResult::failed($res->status(), $res->body());
        }

        $body = $res->json();
        return WassenderSendResult::sent($body['message_id'] ?? null);
    }

    public function sendToPhone(string $phone, string $message): WassenderSendResult
    {
        $res = $this->http
            ->withToken($this->apiKey)
            ->retry(3, 1500, throw: false)
            ->post("https://api.wassender.com/v1/instances/{$this->instanceId}/messages", [
                'type'    => 'text',
                'phone'   => $phone,
                'message' => $message,
            ]);

        if (!$res->successful()) {
            return WassenderSendResult::failed($res->status(), $res->body());
        }

        $body = $res->json();
        return WassenderSendResult::sent($body['message_id'] ?? null);
    }

    public function testConnection(WhatsAppGroup $group): WassenderSendResult
    {
        return $this->sendToGroup($group, 'Test ✓ Azhary');
    }
}
