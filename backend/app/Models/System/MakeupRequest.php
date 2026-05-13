<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class MakeupRequest extends Model
{
    use LogsActivity;

    protected $table = 'sys_makeup_requests';

    protected $guarded = [];

    protected $casts = [
        'proposed_start_at' => 'datetime',
        'reviewed_at'       => 'datetime',
    ];

    public function originalSession() { return $this->belongsTo(Session::class, 'original_session_id'); }
    public function makeupSession()   { return $this->belongsTo(Session::class, 'makeup_session_id'); }
    public function requestedBy()     { return $this->belongsTo(User::class, 'requested_by_user_id'); }
    public function reviewedBy()      { return $this->belongsTo(User::class, 'reviewed_by_user_id'); }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'review_note', 'reviewed_at', 'makeup_session_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
