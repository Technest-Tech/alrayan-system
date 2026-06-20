<?php

namespace App\Jobs\System;

use App\Models\System\Session;
use App\Services\Integrations\Zoom\MeetingRequest;
use App\Services\Integrations\Zoom\ZoomClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdateSessionZoomMeeting implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public Session $session) {}

    public function handle(ZoomClient $zoom): void
    {
        $session = $this->session->loadMissing(['student', 'teacher']);

        if (!$session->zoom_meeting_id) {
            CreateSessionZoomMeeting::dispatch($session);
            return;
        }

        $topic = "Azhary — {$session->student->name} with {$session->teacher->user->name}";

        $req = new MeetingRequest(
            topic:           $topic,
            startUtc:        $session->scheduled_start->utc(),
            durationMinutes: $session->duration_min,
        );

        try {
            $zoom->updateMeeting($session->zoom_meeting_id, $req);
        } catch (\Throwable $e) {
            $zoom->recordError($e->getMessage());
            Log::error("Zoom updateMeeting failed for session {$session->id}: {$e->getMessage()}");
            throw $e;
        }
    }
}
