<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherLeave extends Model
{
    protected $table = 'sys_teacher_leaves';

    protected $guarded = [];

    protected $casts = [
        'start_date'  => 'date',
        'end_date'    => 'date',
        'reviewed_at' => 'datetime',
    ];

    public function teacher()        { return $this->belongsTo(Teacher::class, 'teacher_id'); }
    public function reviewedBy()     { return $this->belongsTo(User::class, 'reviewed_by_user_id'); }
}
