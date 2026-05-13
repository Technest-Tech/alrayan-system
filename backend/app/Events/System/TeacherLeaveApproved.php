<?php

namespace App\Events\System;

use App\Models\System\TeacherLeave;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TeacherLeaveApproved
{
    use Dispatchable, SerializesModels;

    public function __construct(public TeacherLeave $leave) {}
}
