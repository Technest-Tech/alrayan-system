<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class SessionReport extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_session_reports';

    protected $guarded = [];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function session() { return $this->belongsTo(Session::class); }
    public function teacher() { return $this->belongsTo(Teacher::class); }
    public function student() { return $this->belongsTo(Student::class); }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['covered_text', 'performance', 'homework_text', 'next_session_notes'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
