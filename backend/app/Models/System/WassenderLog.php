<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WassenderLog extends Model
{
    protected $table = 'sys_wassender_logs';

    protected $guarded = [];

    protected $casts = [
        'payload' => 'array',
        'sent_at' => 'datetime',
    ];

    public function whatsappGroup() { return $this->belongsTo(WhatsAppGroup::class, 'whatsapp_group_id'); }

    public function scopeSent($q)   { return $q->where('status', 'sent'); }
    public function scopeFailed($q) { return $q->whereIn('status', ['failed', 'dead']); }
}
