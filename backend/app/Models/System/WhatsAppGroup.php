<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class WhatsAppGroup extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_whatsapp_groups';

    protected $guarded = [];

    public function linkedStudent() { return $this->belongsTo(Student::class, 'linked_student_id'); }
    public function linkedTeacher() { return $this->belongsTo(Teacher::class, 'linked_teacher_id'); }
    public function createdBy()     { return $this->belongsTo(User::class, 'created_by_user_id'); }
    public function wassenderLogs() { return $this->hasMany(WassenderLog::class, 'whatsapp_group_id'); }

    public function scopeActive($q) { return $q->where('status', 'active'); }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['type', 'invite_link', 'status', 'linked_student_id', 'linked_teacher_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
