<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherReview extends Model
{
    protected $fillable = [
        'teacher_id', 'author', 'rating', 'text', 'text_fr', 'approved', 'sort_order',
    ];

    protected $casts = [
        'rating'     => 'integer',
        'approved'   => 'boolean',
        'sort_order' => 'integer',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }
}
