<?php

namespace App\Services\System;

use App\Jobs\System\SendWhatsAppMessage;
use App\Models\System\WhatsAppSendLog;
use Illuminate\Support\Str;
use InvalidArgumentException;

class WhatsAppDispatcher
{
    public function sendText(string $phone, string $text, string $kind = WhatsAppSendLog::KIND_TEXT): WhatsAppSendLog
    {
        if (trim($text) === '') {
            throw new InvalidArgumentException('WhatsApp text message body cannot be empty.');
        }

        return $this->enqueue([
            'recipient_phone' => self::normalizePhone($phone),
            'kind'            => $kind,
            'body'            => $text,
        ]);
    }

    public function sendImage(
        string $phone,
        string $imageUrl,
        ?string $caption = null,
        string $kind = WhatsAppSendLog::KIND_IMAGE,
    ): WhatsAppSendLog {
        self::assertPubliclyFetchableUrl($imageUrl);

        return $this->enqueue([
            'recipient_phone' => self::normalizePhone($phone),
            'kind'            => $kind,
            'image_url'       => $imageUrl,
            'caption'         => $caption,
        ]);
    }

    /**
     * Reuses the original idempotency key on purpose: if the first attempt was
     * accepted upstream but we failed to record it, Acadmyq answers DUPLICATE
     * rather than delivering the message a second time.
     */
    public function resend(WhatsAppSendLog $log): WhatsAppSendLog
    {
        $log->update([
            'status'      => WhatsAppSendLog::STATUS_QUEUED,
            'error'       => null,
            'http_status' => null,
        ]);

        SendWhatsAppMessage::dispatch($log->id)->onQueue('notifications');

        return $log;
    }

    private function enqueue(array $attributes): WhatsAppSendLog
    {
        $log = WhatsAppSendLog::create($attributes + [
            'status'          => WhatsAppSendLog::STATUS_QUEUED,
            'idempotency_key' => 'wa-' . Str::ulid(),
        ]);

        SendWhatsAppMessage::dispatch($log->id)->onQueue('notifications');

        return $log;
    }

    public static function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        $digits = preg_replace('/^00/', '', $digits) ?? '';

        if (strlen($digits) < 8 || strlen($digits) > 15) {
            throw new InvalidArgumentException("Not a valid international phone number: {$phone}");
        }

        return $digits;
    }

    /**
     * Acadmyq fetches the image server-side and rejects non-https or private
     * hosts with a 422. Failing here keeps a doomed row out of the queue.
     */
    public static function assertPubliclyFetchableUrl(string $url): void
    {
        $parts = parse_url($url);

        if (($parts['scheme'] ?? null) !== 'https' || empty($parts['host'])) {
            throw new InvalidArgumentException("Image URL must be a public https URL: {$url}");
        }

        $host = $parts['host'];

        $isPrivateIp = filter_var($host, FILTER_VALIDATE_IP)
            && !filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);

        $isLocalName = $host === 'localhost'
            || str_ends_with($host, '.local')
            || str_ends_with($host, '.internal');

        if ($isPrivateIp || $isLocalName) {
            throw new InvalidArgumentException("Image URL host is not publicly reachable: {$host}");
        }
    }
}
