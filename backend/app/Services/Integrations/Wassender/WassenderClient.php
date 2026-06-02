<?php

namespace App\Services\Integrations\Wassender;

use App\Models\System\WhatsAppGroup;
use Illuminate\Http\Client\Factory as HttpClient;

class WassenderClient
{
    private const BASE = 'https://wasenderapi.com/api';

    public function __construct(
        private string $apiKey,
        private HttpClient $http,
    ) {}

    public function sendToGroup(WhatsAppGroup $group, string $message): WassenderSendResult
    {
        $jid = $group->external_group_id;
        if (!$jid) {
            return WassenderSendResult::failed(422, 'Group has no JID configured (external_group_id is empty)');
        }
        return $this->sendText($jid, $message);
    }

    public function sendToPhone(string $phone, string $message): WassenderSendResult
    {
        $jid = str_contains($phone, '@') ? $phone : ltrim($phone, '+') . '@s.whatsapp.net';
        return $this->sendText($jid, $message);
    }

    public function sendText(string $to, string $text): WassenderSendResult
    {
        $res = $this->request()->post(self::BASE . '/send-message', [
            'to'   => $to,
            'text' => $text,
        ]);
        return $this->parse($res);
    }

    public function sendImage(string $to, string $imageUrl, ?string $caption = null): WassenderSendResult
    {
        $payload = ['to' => $to, 'imageUrl' => $imageUrl];
        if ($caption !== null) $payload['caption'] = $caption;

        $res = $this->request()->post(self::BASE . '/send-message', $payload);
        return $this->parse($res);
    }

    public function sendDocument(string $to, string $documentUrl, string $fileName): WassenderSendResult
    {
        $res = $this->request()->post(self::BASE . '/send-message', [
            'to'          => $to,
            'documentUrl' => $documentUrl,
            'fileName'    => $fileName,
        ]);
        return $this->parse($res);
    }

    public function sendVideo(string $to, string $videoUrl, ?string $caption = null): WassenderSendResult
    {
        $payload = ['to' => $to, 'videoUrl' => $videoUrl];
        if ($caption !== null) $payload['caption'] = $caption;

        $res = $this->request()->post(self::BASE . '/send-message', $payload);
        return $this->parse($res);
    }

    public function status(): WassenderSendResult
    {
        $res = $this->request()->get(self::BASE . '/status');
        return $this->parse($res);
    }

    public function testConnection(WhatsAppGroup $group): WassenderSendResult
    {
        return $this->sendToGroup($group, 'Test ✓ Alrayan Academy');
    }

    private function request()
    {
        return $this->http
            ->withToken($this->apiKey)
            ->retry(3, 1500, throw: false);
    }

    private function parse($res): WassenderSendResult
    {
        if (!$res->successful()) {
            return WassenderSendResult::failed($res->status(), $res->body());
        }
        $body = $res->json();
        return WassenderSendResult::sent($body['messageId'] ?? $body['message_id'] ?? null);
    }
}
