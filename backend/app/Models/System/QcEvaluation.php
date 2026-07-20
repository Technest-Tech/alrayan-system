<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class QcEvaluation extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_qc_evaluations';

    protected $guarded = [];

    protected $casts = [
        'duration_minutes' => 'integer',
        'score'            => 'decimal:2',
        'evaluated_at'     => 'datetime',
    ];

    public const DURATIONS = [10, 15, 20, 25, 30, 45, 60];

    public function teacher()        { return $this->belongsTo(Teacher::class, 'teacher_id'); }
    public function student()        { return $this->belongsTo(Student::class, 'student_id'); }
    public function qualityManager() { return $this->belongsTo(User::class, 'quality_manager_id'); }
    public function items()          { return $this->hasMany(QcEvaluationItem::class, 'evaluation_id'); }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['teacher_id', 'student_id', 'quality_manager_id', 'duration_minutes', 'score'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
