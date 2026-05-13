<?php

namespace App\Events\System;

use App\Models\System\Teacher;

class TeacherUnderperforming
{
    public function __construct(public readonly Teacher $teacher, public readonly int $overall) {}
}
