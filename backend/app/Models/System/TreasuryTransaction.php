<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class TreasuryTransaction extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    public const IN  = 'in';
    public const OUT = 'out';

    public const KIND_INCOME     = 'income';
    public const KIND_DEPOSIT    = 'deposit';
    public const KIND_WITHDRAWAL = 'withdrawal';
    public const KIND_ADJUSTMENT = 'adjustment';
    public const KIND_EXPENSE    = 'expense';
    public const KIND_TRANSFER   = 'transfer';
    public const KIND_STUDENT_PAYMENT = 'student_payment';
    public const KIND_TEACHER_SALARY  = 'teacher_salary';

    /** Which directions a hand-entered movement of each kind may take. */
    public const MANUAL_KINDS = [
        self::KIND_INCOME     => [self::IN],
        self::KIND_DEPOSIT    => [self::IN],
        self::KIND_WITHDRAWAL => [self::OUT],
        self::KIND_ADJUSTMENT => [self::IN, self::OUT],
    ];

    /** SQL for a row's effect on its account's balance. */
    public const SIGNED_SQL = "CASE WHEN direction = 'in' THEN amount_minor ELSE -amount_minor END";

    protected $table = 'sys_treasury_transactions';
    protected $guarded = [];
    protected $casts = [
        'occurred_on'  => 'date',
        'amount_minor' => 'integer',
    ];

    public function account()
    {
        return $this->belongsTo(TreasuryAccount::class, 'account_id')->withTrashed();
    }

    public function expense()
    {
        return $this->belongsTo(Expense::class, 'expense_id')->withTrashed();
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /** Expense, transfer and automatic rows are owned elsewhere; only manual rows are edited directly. */
    public function isManual(): bool
    {
        return array_key_exists($this->kind, self::MANUAL_KINDS);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['account_id', 'direction', 'kind', 'amount_minor', 'occurred_on', 'description'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
