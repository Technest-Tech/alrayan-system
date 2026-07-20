<?php

namespace App\Models\System;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class QcAssignment extends Model
{
    protected $table = 'sys_qc_assignments';

    protected $guarded = [];

    public function qualityManager() { return $this->belongsTo(User::class, 'quality_manager_id'); }
    public function teacher()        { return $this->belongsTo(Teacher::class, 'teacher_id'); }
}
