<?php

namespace App\Models;

use App\Models\System\Lead;
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

    /** The CRM lead this booking was surfaced as. */
    public function lead()
    {
        return $this->hasOne(Lead::class);
    }
}
