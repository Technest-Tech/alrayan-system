<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class QualityReview extends Model
{
    use LogsActivity;

    protected $table = 'sys_quality_reviews';
    protected $guarded = [];

    protected $casts = ['inputs' => 'array'];

    public function teacher()  { return $this->belongsTo(Teacher::class); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewer_user_id'); }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['overall_score', 'attendance_score', 'reports_score', 'retention_score', 'punctuality_score'])
            ->logOnlyDirty()
            ->useLogName('system');
    }
}
