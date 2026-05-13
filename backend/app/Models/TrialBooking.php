<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrialBooking extends Model
{
    protected $fillable = [
        'reference', 'name', 'email', 'country', 'phone',
        'age_group', 'course_interest', 'preferred_time',
        'timezone', 'message', 'source', 'status', 'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];
}
