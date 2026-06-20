<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Task extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_tasks';

    protected $guarded = [];

    protected $casts = [
        'payload'    => 'array',
        'due_at'     => 'datetime',
        'decided_at' => 'datetime',
    ];

    public const STATUSES   = ['new', 'following_up', 'review_underway', 'done', 'postponed'];
    public const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    public const TYPES = [
        'package_complete',
        'schedule_removal',
        'late_lesson_deduction',
        'absent_paid_approval',
        'free_lesson_approval',
        'birthday_reminder',
        'trial_lesson_info',
        'teacher_referral_bonus',
        'manual_task',
        'review_progress_report',
    ];

    /**
     * Per-type metadata: default priority, default assignee role, and whether the
     * task is actionable (shows Approve / Reject and may apply a side-effect).
     * Adding a new type is just one entry here + a TaskActionService match arm.
     */
    public const TYPE_META = [
        'package_complete'       => ['priority' => 'medium', 'role' => 'supervisor', 'actionable' => false],
        'schedule_removal'       => ['priority' => 'high',   'role' => 'supervisor', 'actionable' => false],
        'late_lesson_deduction'  => ['priority' => 'high',   'role' => 'accountant', 'actionable' => true],
        'absent_paid_approval'   => ['priority' => 'high',   'role' => 'supervisor', 'actionable' => true],
        'free_lesson_approval'   => ['priority' => 'medium', 'role' => 'supervisor', 'actionable' => true],
        'birthday_reminder'      => ['priority' => 'low',    'role' => 'supervisor', 'actionable' => false],
        'trial_lesson_info'      => ['priority' => 'medium', 'role' => 'supervisor', 'actionable' => false],
        'teacher_referral_bonus' => ['priority' => 'medium', 'role' => 'accountant', 'actionable' => true],
        'manual_task'            => ['priority' => 'medium', 'role' => null,         'actionable' => false],
        'review_progress_report' => ['priority' => 'medium', 'role' => 'quality',    'actionable' => true],
    ];

    public static function isActionable(string $type): bool
    {
        return (bool) (self::TYPE_META[$type]['actionable'] ?? false);
    }

    public function student()  { return $this->belongsTo(Student::class, 'student_id'); }
    public function teacher()  { return $this->belongsTo(Teacher::class, 'teacher_id'); }
    public function related()  { return $this->morphTo(); }
    public function assignee() { return $this->belongsTo(User::class, 'assignee_user_id'); }
    public function creator()  { return $this->belongsTo(User::class, 'created_by'); }
    public function decider()  { return $this->belongsTo(User::class, 'decided_by'); }
    public function notes()    { return $this->hasMany(TaskNote::class)->latest(); }

    public function scopeForRoles($q, array $roles)
    {
        return $q->whereIn('assignee_role', $roles);
    }

    public function scopeActionable($q)
    {
        $types = array_keys(array_filter(self::TYPE_META, fn ($m) => $m['actionable']));
        return $q->whereIn('type', $types);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'priority', 'assignee_role', 'assignee_user_id', 'decision'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
