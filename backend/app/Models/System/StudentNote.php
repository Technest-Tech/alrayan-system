<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentNote extends Model
{
    use SoftDeletes;

    protected $table = 'sys_student_notes';

    protected $guarded = [];

    protected $casts = [
        'pinned' => 'boolean',
    ];

    public function student() { return $this->belongsTo(Student::class, 'student_id'); }
    public function author()  { return $this->belongsTo(User::class, 'author_user_id'); }
}
