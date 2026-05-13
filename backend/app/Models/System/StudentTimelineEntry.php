<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentTimelineEntry extends Model
{
    protected $table = 'sys_student_timeline';

    protected $guarded = [];

    protected $casts = ['payload' => 'array'];

    public function student() { return $this->belongsTo(Student::class, 'student_id'); }
    public function actor()   { return $this->belongsTo(User::class, 'actor_user_id'); }
}
