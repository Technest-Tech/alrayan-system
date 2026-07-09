<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsAppSendLog extends Model
{
    use HasFactory;

    public const STATUS_QUEUED    = 'QUEUED';
    public const STATUS_ACCEPTED  = 'ACCEPTED';
    public const STATUS_DUPLICATE = 'DUPLICATE';
    public const STATUS_FAILED    = 'FAILED';

    public const KIND_TEXT   = 'TEXT';
    public const KIND_IMAGE  = 'IMAGE';
    public const KIND_REPORT = 'REPORT';

    protected $table = 'sys_whatsapp_send_logs';

    protected $guarded = [];

    protected $casts = [
        'http_status'   => 'integer',
        'attempt_count' => 'integer',
    ];

    public function settled(): bool
    {
        return in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_DUPLICATE], true);
    }

    public function scopeFailed($q)   { return $q->where('status', self::STATUS_FAILED); }
    public function scopeAccepted($q) { return $q->where('status', self::STATUS_ACCEPTED); }
}
