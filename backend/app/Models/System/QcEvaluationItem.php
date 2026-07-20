<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class QcEvaluationItem extends Model
{
    protected $table = 'sys_qc_evaluation_items';

    protected $guarded = [];

    protected $casts = [
        'penalty' => 'integer',
        'checked' => 'boolean',
    ];

    public function evaluation()
    {
        return $this->belongsTo(QcEvaluation::class, 'evaluation_id');
    }
}
