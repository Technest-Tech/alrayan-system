<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Payroll extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'sys_payrolls';
    protected $guarded = [];

    protected $casts = [
        'breakdown_by_duration' => 'array',
        'snapshot'              => 'array',
        'approved_at'           => 'datetime',
        'rejected_at'           => 'datetime',
        'transferred_at'        => 'datetime',
    ];

    public function teacher()     { return $this->belongsTo(Teacher::class); }
    public function adjustments() { return $this->hasMany(PayrollAdjustment::class); }
    public function bonuses()     { return $this->adjustments()->where('type', 'bonus'); }
    public function deductions()  { return $this->adjustments()->where('type', 'deduction'); }
    public function approver()    { return $this->belongsTo(User::class, 'approved_by_user_id'); }

    public function recomputeTotals(): void
    {
        $this->bonuses_minor    = (int) $this->bonuses()->sum('amount_minor');
        $this->deductions_minor = (int) $this->deductions()->sum('amount_minor');
        $this->net_salary_minor = $this->base_salary_minor + $this->bonuses_minor - $this->deductions_minor;
        $this->save();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'net_salary_minor', 'approved_at', 'rejected_at', 'transferred_at', 'transfer_reference'])
            ->logOnlyDirty()
            ->useLogName('system');
    }
}
