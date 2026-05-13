<?php

namespace App\Jobs\System;

use App\Models\System\Session;
use App\Models\System\Student;
use App\Services\Integrations\Zoom\MeetingRequest;
use App\Services\Integrations\Zoom\ZoomClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CreateSessionZoomMeeting implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public Session $session) {}

    public function handle(ZoomClient $zoom): void
    {
        $session = $this->session->loadMissing(['student', 'teacher']);
        $student = $session->student;
        $teacher = $session->teacher;

        $topic = "Alrayan Academy — {$student->name} with {$teacher->user->name}";

        $req = new MeetingRequest(
            topic:           $topic,
            startUtc:        $session->scheduled_start->utc(),
            durationMinutes: $session->duration_min,
        );

        try {
            $res = $zoom->createMeeting($req);
            $session->update([
                'zoom_meeting_id' => $res->meetingId,
                'zoom_join_url'   => $res->joinUrl,
                'zoom_start_url'  => $res->startUrl,
            ]);
        } catch (\Throwable $e) {
            $zoom->recordError($e->getMessage());
            Log::error("Zoom createMeeting failed for session {$session->id}: {$e->getMessage()}");
            throw $e;
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error("CreateSessionZoomMeeting permanently failed for session {$this->session->id}: {$e->getMessage()}");
    }
}
