<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Invoice extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_invoices';
    protected $guarded = [];
    protected $casts = [
        'snapshot'            => 'array',
        'issued_at'           => 'datetime',
        'due_at'              => 'datetime',
        'paid_at'             => 'datetime',
        'voided_at'           => 'datetime',
        'subtotal_minor'      => 'integer',
        'discount_minor'      => 'integer',
        'wallet_credit_minor' => 'integer',
        'total_minor'         => 'integer',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function lines()
    {
        return $this->hasMany(InvoiceLine::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function paymobLink()
    {
        return $this->hasOne(PaymobPaymentLink::class)->where('is_active', true)->latest();
    }

    public function createdBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by_user_id');
    }

    public function scopeOpen($q)
    {
        return $q->whereIn('status', ['sent', 'overdue']);
    }

    public function scopeOverdue($q)
    {
        return $q->where('status', 'overdue');
    }

    public function isOverdueNow(): bool
    {
        return in_array($this->status, ['sent', 'overdue']) && $this->due_at && $this->due_at->isPast();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'total_minor', 'paid_at', 'voided_at', 'voided_reason'])
            ->logOnlyDirty()
            ->useLogName('system');
    }
}
