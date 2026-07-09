<?php

namespace App\Services\Integrations\Acadmyq;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory as HttpClient;
use Illuminate\Http\Client\Response;

class AcadmyqClient
{
    public function __construct(
        private string $baseUrl,
        private string $apiKey,
        private HttpClient $http,
        private int $timeout = 15,
    ) {}

    public function sendText(string $to, string $text, string $idempotencyKey): WhatsAppSendResult
    {
        return $this->send(['to' => $to, 'text' => $text], $idempotencyKey);
    }

    public function sendImage(string $to, string $imageUrl, ?string $caption, string $idempotencyKey): WhatsAppSendResult
    {
        $payload = ['to' => $to, 'image_url' => $imageUrl];

        if ($caption !== null && $caption !== '') {
            $payload['caption'] = $caption;
        }

        return $this->send($payload, $idempotencyKey);
    }

    /**
     * Null when the check itself failed — distinct from a definitive "this
     * number is not on WhatsApp".
     */
    public function checkNumber(string $phone): ?bool
    {
        try {
            $res = $this->request()->get("{$this->baseUrl}/api/wa/v1/contacts/{$phone}");
        } catch (ConnectionException) {
            return null;
        }

        return $res->successful() ? (bool) $res->json('exists') : null;
    }

    /** @return array{status: string, connected: bool} */
    public function status(): array
    {
        try {
            $res = $this->request()->get("{$this->baseUrl}/api/wa/v1/status");
        } catch (ConnectionException) {
            return ['status' => 'UNREACHABLE', 'connected' => false];
        }

        if (!$res->successful()) {
            return ['status' => $res->json('error') ?? 'ERROR', 'connected' => false];
        }

        return [
            'status'    => $res->json('status') ?? 'UNKNOWN',
            'connected' => (bool) $res->json('connected'),
        ];
    }

    private function send(array $payload, string $idempotencyKey): WhatsAppSendResult
    {
        try {
            $res = $this->request()
                ->withHeader('Idempotency-Key', $idempotencyKey)
                ->post("{$this->baseUrl}/api/wa/v1/messages", $payload);
        } catch (ConnectionException $e) {
            return WhatsAppSendResult::failed(null, $e->getMessage());
        }

        return $this->interpret($res);
    }

    private function interpret(Response $res): WhatsAppSendResult
    {
        if ($res->status() === 202) {
            return WhatsAppSendResult::accepted($res->json('message_id'), 202);
        }

        // Acadmyq answers a replayed Idempotency-Key with 200 + status=duplicate.
        if ($res->status() === 200 && $res->json('status') === 'duplicate') {
            return WhatsAppSendResult::duplicate(200);
        }

        $error = $res->json('error') ?? $res->json('message') ?? $res->body();

        return WhatsAppSendResult::failed($res->status(), (string) $error);
    }

    private function request()
    {
        return $this->http
            ->withToken($this->apiKey)
            ->acceptJson()
            ->timeout($this->timeout);
    }
}
