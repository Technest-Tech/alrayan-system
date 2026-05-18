<?php

namespace App\Models;

use App\Services\NextRevalidationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = [
        'slug', 'title', 'short_description', 'long_description',
        'icon', 'age_group', 'level', 'duration_months',
        'features', 'seo_title', 'seo_description',
        'outcomes', 'curriculum', 'personas', 'faqs',
        'related_slugs', 'specialty_tags', 'active', 'sort_order',
        'is_active_for_system',
    ];

    protected $casts = [
        'features'      => 'array',
        'outcomes'      => 'array',
        'curriculum'    => 'array',
        'personas'      => 'array',
        'faqs'          => 'array',
        'related_slugs' => 'array',
        'specialty_tags'=> 'array',
        'active'        => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saved(function (Course $course) {
            app(NextRevalidationService::class)->revalidate([
                '/courses',
                "/courses/{$course->slug}",
            ]);
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true)->orderBy('sort_order');
    }

    public function students(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\System\Student::class, 'course_id');
    }
}
