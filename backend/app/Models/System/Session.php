<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Session extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_sessions';

    protected $guarded = [];

    protected $casts = [
        'scheduled_start'    => 'datetime',
        'scheduled_end'      => 'datetime',
        'attended_marked_at' => 'datetime',
        'report_overdue_at'  => 'datetime',
    ];

    public function student()         { return $this->belongsTo(Student::class); }
    public function teacher()         { return $this->belongsTo(Teacher::class); }
    public function pattern()         { return $this->belongsTo(SchedulePattern::class, 'schedule_pattern_id'); }
    public function originalSession() { return $this->belongsTo(Session::class, 'original_session_id'); }
    public function makeups()         { return $this->hasMany(Session::class, 'original_session_id'); }
    public function report()          { return $this->hasOne(SessionReport::class, 'session_id'); }
    public function attendedBy()      { return $this->belongsTo(User::class, 'attended_marked_by_user_id'); }
    public function makeupRequest()   { return $this->hasOne(MakeupRequest::class, 'makeup_session_id'); }

    public function scopeUpcoming($q)
    {
        return $q->where('scheduled_start', '>', now())->where('status', 'scheduled');
    }

    public function scopeToday($q, string $tz = 'UTC')
    {
        $start = now($tz)->startOfDay()->utc();
        $end   = now($tz)->endOfDay()->utc();
        return $q->whereBetween('scheduled_start', [$start, $end]);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'scheduled_start', 'scheduled_end', 'status',
                'teacher_id', 'cancelled_by', 'cancellation_reason',
                'zoom_meeting_id',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
