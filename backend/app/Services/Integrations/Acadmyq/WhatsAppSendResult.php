<?php

namespace App\Services\Integrations\Acadmyq;

class WhatsAppSendResult
{
    public const ACCEPTED  = 'ACCEPTED';
    public const DUPLICATE = 'DUPLICATE';
    public const FAILED    = 'FAILED';

    private function __construct(
        public readonly string $status,
        public readonly ?string $messageId,
        public readonly ?int $httpStatus,
        public readonly ?string $error,
    ) {}

    public static function accepted(?string $messageId, int $httpStatus = 202): self
    {
        return new self(self::ACCEPTED, $messageId, $httpStatus, null);
    }

    public static function duplicate(int $httpStatus = 200): self
    {
        return new self(self::DUPLICATE, null, $httpStatus, null);
    }

    public static function failed(?int $httpStatus, string $error): self
    {
        return new self(self::FAILED, null, $httpStatus, $error);
    }

    public function ok(): bool
    {
        return $this->status !== self::FAILED;
    }

    /**
     * A null httpStatus means the request never got a response (network error,
     * DNS, timeout) — worth another attempt. Acadmyq paces sends behind a
     * ~120 req/min per-key limit, so 429 is expected under burst and retryable.
     * Every other 4xx is a rejected payload, key, or entitlement: retrying it
     * changes nothing.
     */
    public function retryable(): bool
    {
        if ($this->status !== self::FAILED) {
            return false;
        }

        return $this->httpStatus === null
            || $this->httpStatus === 429
            || $this->httpStatus >= 500;
    }
}
