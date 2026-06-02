<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TeacherNote extends Model
{
    use SoftDeletes;

    protected $table = 'sys_teacher_notes';

    protected $guarded = [];

    protected $casts = [
        'pinned' => 'boolean',
    ];

    public function teacher() { return $this->belongsTo(Teacher::class, 'teacher_id'); }
    public function author()  { return $this->belongsTo(User::class, 'author_user_id'); }
}
