<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class QcCategory extends Model
{
    use LogsActivity;

    protected $table = 'sys_qc_categories';

    protected $guarded = [];

    protected $casts = [
        'weight'     => 'integer',
        'sort_order' => 'integer',
        'is_active'  => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(QcCategoryItem::class, 'category_id')->orderBy('sort_order')->orderBy('id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'weight', 'sort_order', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('system');
    }
}
