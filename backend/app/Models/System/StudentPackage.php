<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentPackage extends Model
{
    use SoftDeletes;

    protected $table = 'sys_student_packages';

    protected $guarded = [];

    protected $casts = [
        'package_number'       => 'integer',
        'package_hours'        => 'integer',
        'tariff_at_time'       => 'integer',
        'needs_reconfirmation' => 'boolean',
        'paid_at'              => 'datetime',
    ];

    protected $appends = ['consumed_hours'];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class, 'package_id');
    }

    public function getConsumedHoursAttribute(): float
    {
        return (float) Lesson::where('package_id', $this->id)
            ->whereNotIn('status', ['cancelled'])
            ->sum(\Illuminate\Support\Facades\DB::raw('duration_minutes / 60.0'));
    }
}
