<?php

namespace App\Services\Integrations\Wassender;

class WassenderSendResult
{
    private function __construct(
        public readonly bool $success,
        public readonly ?string $externalId,
        public readonly ?int $statusCode,
        public readonly ?string $errorBody,
    ) {}

    public static function sent(?string $externalId): self
    {
        return new self(true, $externalId, null, null);
    }

    public static function failed(int $statusCode, string $body): self
    {
        return new self(false, null, $statusCode, $body);
    }
}
