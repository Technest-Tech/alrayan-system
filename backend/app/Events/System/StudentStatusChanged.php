<?php

namespace App\Events\System;

use App\Models\System\Student;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Student $student,
        public string  $oldStatus,
        public string  $newStatus,
    ) {}
}
