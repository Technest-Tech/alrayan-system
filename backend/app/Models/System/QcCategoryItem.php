<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class QcCategoryItem extends Model
{
    protected $table = 'sys_qc_category_items';

    protected $guarded = [];

    protected $casts = [
        'penalty'    => 'integer',
        'sort_order' => 'integer',
        'is_active'  => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(QcCategory::class, 'category_id');
    }
}
