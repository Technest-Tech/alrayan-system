<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class LessonScheduleSlot extends Model
{
    protected $table = 'sys_lesson_schedule_slots';

    protected $guarded = [];

    protected $casts = [
        'day_of_week'      => 'integer',
        'duration_minutes' => 'integer',
    ];

    public function schedule()
    {
        return $this->belongsTo(LessonSchedule::class, 'schedule_id');
    }
}
