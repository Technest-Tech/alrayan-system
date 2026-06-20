<?php

namespace App\Models\System;

use App\Models\Course;
use App\Models\TrialBooking;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Lead extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_leads';

    protected $guarded = [];

    protected $casts = ['payload' => 'array'];

    public function followUps()          { return $this->hasMany(LeadFollowUp::class)->latest('due_at'); }
    public function trialBooking()       { return $this->belongsTo(TrialBooking::class); }
    public function convertedToStudent() { return $this->belongsTo(Student::class, 'converted_to_student_id'); }
    public function student()            { return $this->belongsTo(Student::class, 'student_id'); }
    public function supervisor()         { return $this->belongsTo(User::class, 'assigned_supervisor_id'); }
    public function courseInterest()     { return $this->belongsTo(Course::class, 'course_interest_id'); }

    public function scopeActive($q)   { return $q->whereNotIn('status', ['closed', 'lost', 'not_interested']); }
    public function scopeSearch($q, string $term)
    {
        $like = '%' . $term . '%';
        $q->where(fn($sq) => $sq
            ->where('name', 'like', $like)
            ->orWhere('email', 'like', $like)
            ->orWhere('phone', 'like', $like)
            ->orWhere('whatsapp', 'like', $like)
        );
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'lost_reason', 'assigned_supervisor_id', 'converted_to_student_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
