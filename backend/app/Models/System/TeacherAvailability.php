<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherAvailability extends Model
{
    protected $table = 'sys_teacher_availability';

    protected $guarded = [];

    public function teacher() { return $this->belongsTo(Teacher::class, 'teacher_id'); }
}
