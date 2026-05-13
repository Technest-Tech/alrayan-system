<?php

namespace App\Models;

use App\Services\NextRevalidationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BlogPost extends Model
{
    protected $fillable = [
        'title', 'slug', 'excerpt', 'body', 'cover_image',
        'seo_title', 'seo_description', 'status', 'published_at',
        'reading_minutes', 'author_id',
    ];

    protected $casts = [
        'published_at'    => 'datetime',
        'reading_minutes' => 'integer',
    ];

    protected static function booted(): void
    {
        static::saved(function (BlogPost $post) {
            if ($post->wasChanged('status') && $post->status === 'published') {
                app(NextRevalidationService::class)->revalidate([
                    '/blog',
                    "/blog/{$post->slug}",
                ]);
            }
        });
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
                     ->whereNotNull('published_at')
                     ->where('published_at', '<=', now());
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(BlogCategory::class, 'blog_post_category');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
