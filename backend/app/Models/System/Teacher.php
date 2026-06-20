<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Teacher extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_teachers';

    protected $guarded = [];

    protected $casts = [
        'teachable_course_ids'    => 'array',
        'payment_account_details' => 'encrypted',
        'is_active'               => 'boolean',
        'accepts_new_students'    => 'boolean',
    ];

    public function user()          { return $this->belongsTo(User::class); }
    public function students()      { return $this->hasMany(Student::class, 'assigned_teacher_id'); }
    public function whatsappGroup() { return $this->belongsTo(WhatsAppGroup::class, 'whatsapp_group_id'); }
    public function availability() { return $this->hasMany(TeacherAvailability::class, 'teacher_id')->orderBy('day_of_week')->orderBy('start_time'); }
    public function leaves()       { return $this->hasMany(TeacherLeave::class, 'teacher_id'); }
    public function notes()          { return $this->hasMany(TeacherNote::class, 'teacher_id')->orderByDesc('pinned')->latest(); }
    public function payrolls()       { return $this->hasMany(Payroll::class); }
    public function qualityReviews() { return $this->hasMany(QualityReview::class); }

    public function scopeWhereTeachesCourse($query, $courseId): void
    {
        $query->whereJsonContains('teachable_course_ids', (int) $courseId);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['education_level', 'years_of_experience', 'qualifications', 'cv_url', 'payment_method', 'hourly_rate', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
