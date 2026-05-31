<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LessonSchedule extends Model
{
    use SoftDeletes;

    protected $table = 'sys_lesson_schedules';

    protected $guarded = [];

    protected $casts = [
        'is_active'  => 'boolean',
        'start_date' => 'date',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function subject()
    {
        return $this->belongsTo(LessonSubject::class, 'subject_id');
    }

    public function slots()
    {
        return $this->hasMany(LessonScheduleSlot::class, 'schedule_id');
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class, 'schedule_id');
    }
}
