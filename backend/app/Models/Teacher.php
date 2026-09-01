<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Teacher extends Model
{
    protected $fillable = [
        'slug', 'name', 'name_arabic', 'role', 'title', 'country', 'bio', 'image',
        'specialties', 'languages', 'tags', 'credentials',
        'is_female', 'years_experience', 'students_count',
        'rating', 'reviews_count', 'hourly_rate', 'currency',
        'elite', 'for_children', 'free_trial',
        'courses_given', 'teaching_hours',
        'quote', 'about', 'teaching_style', 'strengths',
        'featured', 'sort_order',
        // French translations (nullable; English is the fallback).
        'role_fr', 'title_fr', 'country_fr', 'bio_fr', 'credentials_fr',
        'quote_fr', 'about_fr', 'teaching_style_fr', 'strengths_fr',
        'specialties_fr', 'languages_fr', 'tags_fr',
    ];

    protected $casts = [
        'specialties'      => 'array',
        'languages'        => 'array',
        'tags'             => 'array',
        'specialties_fr'   => 'array',
        'languages_fr'     => 'array',
        'tags_fr'          => 'array',
        'is_female'        => 'boolean',
        'featured'         => 'boolean',
        'elite'            => 'boolean',
        'for_children'     => 'boolean',
        'free_trial'       => 'boolean',
        'years_experience' => 'integer',
        'students_count'   => 'integer',
        'courses_given'    => 'integer',
        'teaching_hours'   => 'integer',
        'hourly_rate'      => 'integer',
        'reviews_count'    => 'integer',
        'rating'           => 'float',
    ];

    public function reviews(): HasMany
    {
        return $this->hasMany(TeacherReview::class)->orderBy('sort_order');
    }

    /**
     * The slug is the public URL and the route key, so a teacher without one is
     * invisible: the site links to a numeric id that `show()` cannot resolve and
     * the profile 404s. Fill it here rather than at each call site, so seeders,
     * imports and tinker sessions get the same guarantee the admin panel does.
     */
    protected static function booted(): void
    {
        static::saving(function (self $teacher) {
            if (blank($teacher->slug)) {
                $teacher->slug = self::uniqueSlug($teacher->name ?: 'teacher', $teacher->id);
            }
        });
    }

    /** A URL-safe slug derived from `$source`, suffixed until it is unique. */
    public static function uniqueSlug(string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source) ?: 'teacher';
        $slug = $base;

        for ($i = 2; self::slugTaken($slug, $ignoreId); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }

    private static function slugTaken(string $slug, ?int $ignoreId): bool
    {
        return self::where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
