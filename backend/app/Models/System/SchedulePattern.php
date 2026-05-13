<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class SchedulePattern extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_schedule_patterns';

    protected $guarded = [];

    protected $casts = [
        'valid_from' => 'date',
        'valid_to'   => 'date',
    ];

    public function student() { return $this->belongsTo(Student::class); }
    public function teacher() { return $this->belongsTo(Teacher::class); }
    public function sessions() { return $this->hasMany(Session::class, 'schedule_pattern_id'); }

    public function scopeActive($q)
    {
        return $q->whereNull('deleted_at')
            ->where('valid_from', '<=', now()->toDateString())
            ->where(fn ($q) => $q->whereNull('valid_to')->orWhere('valid_to', '>=', now()->toDateString()));
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['day_of_week', 'start_time', 'duration_min', 'timezone', 'valid_from', 'valid_to', 'teacher_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
