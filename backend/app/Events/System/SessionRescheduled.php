<?php

namespace App\Events\System;

use App\Models\System\Session;
use Carbon\Carbon;
use Illuminate\Foundation\Events\Dispatchable;

class SessionRescheduled
{
    use Dispatchable;

    public function __construct(
        public Session $session,
        public Carbon  $previousStart,
        public Carbon  $previousEnd,
    ) {}
}
