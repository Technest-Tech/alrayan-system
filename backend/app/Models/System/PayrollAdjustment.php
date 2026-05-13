<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PayrollAdjustment extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_payroll_adjustments';
    protected $guarded = [];

    public function payroll()  { return $this->belongsTo(Payroll::class); }
    public function addedBy()  { return $this->belongsTo(User::class, 'added_by_user_id'); }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['type', 'category', 'amount_minor', 'reason'])
            ->logOnlyDirty()
            ->useLogName('system');
    }
}
