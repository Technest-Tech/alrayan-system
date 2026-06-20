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

    /** Statuses that consume hours from the student's package. */
    public const CONSUMING_STATUSES = ['attended', 'paid_absence', 'cancelled_by_student'];

    /**
     * Statuses that are payable to / counted for the teacher.
     * `free` is free for the student (no package consumption) but the teacher is still
     * paid for it; `trial` is excluded — a trial is not calculated for any teacher.
     * (NOTE: teacher payroll currently runs off the Session model; this constant is the
     * single source of truth for when lesson-based teacher calculation is wired up.)
     */
    public const TEACHER_PAID_STATUSES = ['attended', 'paid_absence', 'free'];

    /** All valid lesson statuses (consuming + non-consuming). */
    public const STATUSES = [
        'scheduled', 'attended', 'paid_absence', 'absent',
        'trial', 'free', 'cancelled_by_student', 'cancelled_by_teacher',
    ];

    public function isConsuming(): bool
    {
        return in_array($this->status, self::CONSUMING_STATUSES, true);
    }

    /** Whether the teacher is paid/credited for this lesson. */
    public function isTeacherPaid(): bool
    {
        return in_array($this->status, self::TEACHER_PAID_STATUSES, true);
    }

    protected $casts = [
        'scheduled_at'        => 'datetime',
        'duration_minutes'    => 'integer',
        'session_number_hours' => 'float',
        'subject_details'     => 'array',
        'trial_evaluation'    => 'array',
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

    public function allocations()
    {
        return $this->hasMany(LessonPackageAllocation::class, 'lesson_id')->orderBy('ordinal');
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
