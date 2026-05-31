<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Lesson extends Model
{
    use SoftDeletes, LogsActivity;

    protected $table = 'sys_lessons';

    protected $guarded = [];

    protected $casts = [
        'scheduled_at'        => 'datetime',
        'duration_minutes'    => 'integer',
        'session_number_hours' => 'float',
        'subject_details'     => 'array',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['scheduled_at', 'status', 'evaluation_id', 'teacher_id', 'session_number_hours'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }

    public function package()
    {
        return $this->belongsTo(StudentPackage::class, 'package_id');
    }

    public function schedule()
    {
        return $this->belongsTo(LessonSchedule::class, 'schedule_id');
    }

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

    public function evaluation()
    {
        return $this->belongsTo(LessonEvaluation::class, 'evaluation_id');
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }
}
