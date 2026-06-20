<?php

namespace App\Observers\System;

use App\Events\System\SessionCancelled;
use App\Jobs\System\CreateSessionZoomMeeting;
use App\Jobs\System\DeleteSessionZoomMeeting;
use App\Models\System\Session;

class SessionObserver
{
    public function created(Session $session): void
    {
        if (config('system.features.zoom') || app()->environment('testing')) {
            CreateSessionZoomMeeting::dispatch($session);
        }
    }

    public function updated(Session $session): void
    {
        // Single-point capture of cancellation across every controller path
        // (cancel, markAttendance, bulkAttendance) → generate a schedule-removal task.
        if ($session->wasChanged('status') && $session->status === 'cancelled') {
            SessionCancelled::dispatch($session);
        }
    }

    public function deleting(Session $session): void
    {
        if ($session->zoom_meeting_id) {
            DeleteSessionZoomMeeting::dispatch($session);
        }
    }
}
