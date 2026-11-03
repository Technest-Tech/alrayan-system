<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * A place the academy's money actually sits: a bank account, PayPal, cash in hand.
 * Its balance is never stored — see TreasuryService::balances().
 */
class TreasuryAccount extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    public const TYPES = ['bank', 'paypal', 'cash', 'mobile_wallet', 'other'];

    /** Mirrors the list on the Pricing settings page. */
    public const CURRENCIES = ['USD', 'EUR', 'CAD', 'GBP', 'EGP', 'AED', 'KWD', 'BHD', 'SAR'];

    protected $table = 'sys_treasury_accounts';
    protected $guarded = [];
    protected $casts = [
        'opening_date'          => 'date',
        'opening_balance_minor' => 'integer',
        'is_active'             => 'boolean',
    ];

    public function transactions()
    {
        return $this->hasMany(TreasuryTransaction::class, 'account_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function scopeActive($query): void
    {
        $query->where('is_active', true);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'type', 'currency', 'opening_balance_minor', 'opening_date', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
