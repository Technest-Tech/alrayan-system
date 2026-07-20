<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class QcSpecialRule extends Model
{
    use LogsActivity;

    protected $table = 'sys_qc_special_rules';

    protected $guarded = [];

    protected $casts = [
        'cap_value' => 'integer',
        'is_active' => 'boolean',
    ];

    public const RULE_TYPES = ['score_cap'];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['rule_key', 'rule_type', 'label', 'cap_value', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
