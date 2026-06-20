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

    public function allocations()
    {
        return $this->hasMany(LessonPackageAllocation::class, 'package_id');
    }

    /**
     * Hours consumed in this package — the single source of truth.
     * Split-aware: a boundary lesson contributes only its in-package portion via allocations.
     */
    public function getConsumedHoursAttribute(): float
    {
        return (float) LessonPackageAllocation::where('package_id', $this->id)->sum('hours');
    }
}
