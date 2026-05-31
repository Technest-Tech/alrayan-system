<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class Guardian extends Model
{
    protected $table = 'sys_guardians';

    protected $guarded = [];

    public function students()
    {
        return $this->hasMany(Student::class, 'guardian_id');
    }
}
