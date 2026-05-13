<?php

namespace App\Jobs\System;

use App\Models\System\Session;
use App\Services\Integrations\Zoom\ZoomClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DeleteSessionZoomMeeting implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public Session $session) {}

    public function handle(ZoomClient $zoom): void
    {
        if (!$this->session->zoom_meeting_id) {
            return;
        }

        try {
            $zoom->deleteMeeting($this->session->zoom_meeting_id);
        } catch (\Throwable $e) {
            $zoom->recordError($e->getMessage());
            Log::error("Zoom deleteMeeting failed for session {$this->session->id}: {$e->getMessage()}");
            throw $e;
        }
    }
}
