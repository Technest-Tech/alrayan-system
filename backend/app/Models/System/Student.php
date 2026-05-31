<?php

namespace App\Models\System;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\System\StudentPackage;
use App\Models\System\Lesson;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Student extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_students';

    protected $guarded = [];

    protected $casts = [
        'wallet_balance_minor'  => 'integer',
        'monthly_price_minor'   => 'integer',
        'custom_discount_pct'   => 'integer',
        'sessions_per_month'    => 'integer',
        'session_duration_min'  => 'integer',
        'enrolled_at'           => 'datetime',
        'paused_at'             => 'datetime',
        'suspended_at'          => 'datetime',
        'cancelled_at'          => 'datetime',
        'package_hours_default' => 'integer',
        'hourly_rate_minor'     => 'integer',
    ];

    public function guardian()         { return $this->belongsTo(Guardian::class, 'guardian_id'); }
    public function course()          { return $this->belongsTo(Course::class); }
    public function assignedTeacher() { return $this->belongsTo(Teacher::class, 'assigned_teacher_id'); }
    public function whatsappGroup()   { return $this->belongsTo(WhatsAppGroup::class, 'whatsapp_group_id'); }
    public function timeline()        { return $this->hasMany(StudentTimelineEntry::class, 'student_id')->latest(); }
    public function notes()           { return $this->hasMany(StudentNote::class, 'student_id')->latest(); }

    public function siblings()
    {
        return $this->belongsToMany(
            Student::class,
            'sys_student_family_links',
            'student_id',
            'sibling_student_id'
        )->withPivot('discount_pct')->withTimestamps();
    }

    public function packages()
    {
        return $this->hasMany(StudentPackage::class, 'student_id')->orderBy('package_number');
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class, 'student_id')->latest('scheduled_at');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'student_id');
    }

    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class, 'student_id')->latest();
    }

    public function scopeSearch($query, string $term): void
    {
        $like = '%' . $term . '%';
        $query->where(fn($q) => $q
            ->where('name', 'like', $like)
            ->orWhere('email', 'like', $like)
            ->orWhere('whatsapp', 'like', $like)
            ->orWhereHas('guardian', fn($g) => $g
                ->where('name', 'like', $like)
                ->orWhere('whatsapp', 'like', $like)
            )
        );
    }

    public function scopeNoWhatsapp($query, $value): void
    {
        if ($value) {
            $query->whereNull('whatsapp_group_id');
        }
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'name', 'email', 'whatsapp', 'country', 'timezone',
                'student_type', 'guardian_id', 'course_id', 'assigned_teacher_id',
                'sessions_per_month', 'session_duration_min',
                'monthly_price_minor', 'currency', 'custom_discount_pct',
                'status', 'whatsapp_group_id',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
