<?php

namespace App\Events\System;

use App\Models\System\Session;
use Illuminate\Foundation\Events\Dispatchable;

class SessionAttended
{
    use Dispatchable;

    public function __construct(public Session $session) {}
}
