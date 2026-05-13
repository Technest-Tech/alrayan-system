<?php

namespace App\Services\Integrations\Zoom;

use Carbon\Carbon;

class MeetingRequest
{
    public function __construct(
        public readonly string $topic,
        public readonly Carbon $startUtc,
        public readonly int    $durationMinutes,
        public readonly string $timezone = 'UTC',
    ) {}
}
