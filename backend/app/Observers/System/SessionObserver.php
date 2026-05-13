<?php

namespace App\Observers\System;

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

    public function deleting(Session $session): void
    {
        if ($session->zoom_meeting_id) {
            DeleteSessionZoomMeeting::dispatch($session);
        }
    }
}
