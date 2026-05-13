<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeadFollowUp extends Model
{
    use HasFactory;

    protected $table = 'sys_lead_follow_ups';

    protected $guarded = [];

    protected $casts = [
        'due_at'       => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function lead()  { return $this->belongsTo(Lead::class); }
    public function actor() { return $this->belongsTo(User::class, 'actor_user_id'); }

    public function scopePending($q)
    {
        return $q->whereNull('completed_at');
    }
}
