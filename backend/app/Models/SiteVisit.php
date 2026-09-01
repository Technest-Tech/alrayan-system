<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * One page view on the public marketing site.
 *
 * Rows are written by the tracking beacon and only ever read in aggregate by
 * the site traffic dashboard. There is no `updated_at`: a visit is a fact that
 * happened, not a record that changes.
 */
class SiteVisit extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'visitor_hash', 'session_hash', 'path', 'locale',
        'referrer_host', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign',
        'country', 'device', 'browser', 'os', 'is_bot',
        // Fillable so a visit can be written with the time it actually happened
        // rather than the time the row was inserted.
        'created_at',
    ];

    protected $casts = [
        'is_bot'     => 'boolean',
        'created_at' => 'datetime',
    ];

    /** Real traffic — everything the dashboard reports on excludes bots. */
    public function scopeHuman(Builder $query): Builder
    {
        return $query->where('is_bot', false);
    }
}
