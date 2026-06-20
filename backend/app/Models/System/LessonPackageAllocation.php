<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class LessonPackageAllocation extends Model
{
    protected $table = 'sys_lesson_package_allocations';

    protected $guarded = [];

    protected $casts = [
        'hours'            => 'float',
        'cumulative_hours' => 'float',
        'ordinal'          => 'integer',
    ];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }

    public function package()
    {
        return $this->belongsTo(StudentPackage::class, 'package_id');
    }
}
