<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class LessonEvaluation extends Model
{
    protected $table = 'sys_lesson_evaluations';

    protected $guarded = [];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}
