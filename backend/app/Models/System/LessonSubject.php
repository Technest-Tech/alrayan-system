<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LessonSubject extends Model
{
    use SoftDeletes;

    protected $table = 'sys_lesson_subjects';

    protected $guarded = [];

    protected $casts = [
        'fields'     => 'array',
        'sort_order' => 'integer',
    ];

    public function lessons()
    {
        return $this->hasMany(Lesson::class, 'subject_id');
    }
}
