<?php

namespace App\Events\System;

use App\Models\System\Session;
use Illuminate\Foundation\Events\Dispatchable;

class SessionAbsent
{
    use Dispatchable;

    public function __construct(public Session $session) {}
}
