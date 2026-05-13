<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    protected $fillable = [
        'name', 'name_arabic', 'role', 'bio', 'image',
        'specialties', 'languages', 'credentials',
        'is_female', 'years_experience', 'students_count',
        'featured', 'sort_order',
    ];

    protected $casts = [
        'specialties'     => 'array',
        'languages'       => 'array',
        'is_female'       => 'boolean',
        'featured'        => 'boolean',
        'years_experience'=> 'integer',
        'students_count'  => 'integer',
    ];
}
