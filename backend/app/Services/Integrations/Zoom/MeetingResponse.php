<?php

namespace App\Services\Integrations\Zoom;

class MeetingResponse
{
    public function __construct(
        public readonly string $meetingId,
        public readonly string $joinUrl,
        public readonly string $startUrl,
    ) {}
}
