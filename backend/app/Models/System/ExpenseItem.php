<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * A standing line of expense. `fixed` items cost the same each month and can be recorded
 * once per month; `variable` items have their amount typed each time and may repeat.
 */
class ExpenseItem extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    public const FIXED    = 'fixed';
    public const VARIABLE = 'variable';

    protected $table = 'sys_expense_items';
    protected $guarded = [];
    protected $casts = [
        'default_amount_minor' => 'integer',
        'due_day'              => 'integer',
        'is_active'            => 'boolean',
        'auto_record'          => 'boolean',
        'auto_record_since'    => 'date',
    ];

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'category_id');
    }

    public function defaultAccount()
    {
        return $this->belongsTo(TreasuryAccount::class, 'default_account_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'item_id');
    }

    public function isFixed(): bool
    {
        return $this->type === self::FIXED;
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'category_id', 'type', 'default_amount_minor', 'currency', 'default_account_id', 'due_day', 'auto_record', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
