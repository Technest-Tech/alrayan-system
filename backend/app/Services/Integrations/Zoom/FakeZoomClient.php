<?php

namespace App\Services\Integrations\Zoom;

class FakeZoomClient extends ZoomClient
{
    private static array $log = [];

    public function __construct()
    {
        // no dependencies needed for fake
    }

    public function createMeeting(MeetingRequest $req): MeetingResponse
    {
        $id = 'fake-' . uniqid();
        self::$log[] = ['action' => 'create', 'topic' => $req->topic, 'start' => $req->startUtc->toIso8601String(), 'id' => $id];

        return new MeetingResponse(
            meetingId: $id,
            joinUrl:   "https://zoom.us/j/{$id}",
            startUrl:  "https://zoom.us/s/{$id}?zak=fake-token",
        );
    }

    public function updateMeeting(string $meetingId, MeetingRequest $req): void
    {
        self::$log[] = ['action' => 'update', 'id' => $meetingId, 'start' => $req->startUtc->toIso8601String()];
    }

    public function deleteMeeting(string $meetingId): void
    {
        self::$log[] = ['action' => 'delete', 'id' => $meetingId];
    }

    public function recordError(string $message): void {}

    public static function getLog(): array { return self::$log; }
    public static function clearLog(): void { self::$log = []; }
}
