<?php

use App\Models\Teacher;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * A teacher without a slug is invisible on the public site.
 *
 * The slug is the route key, so the marketing site falls back to linking the
 * numeric id (`/our-teachers/12`), which the public API — which looks teachers
 * up by slug — cannot resolve, and the profile 404s. Production had one such
 * row; the model now fills the slug in on every write, and this backfills the
 * rows that predate that guarantee.
 */
return new class extends Migration
{
    public function up(): void
    {
        $slugless = DB::table('teachers')
            ->where(fn ($q) => $q->whereNull('slug')->orWhere('slug', ''))
            ->get(['id', 'name']);

        foreach ($slugless as $row) {
            DB::table('teachers')
                ->where('id', $row->id)
                ->update(['slug' => Teacher::uniqueSlug($row->name ?: 'teacher', $row->id)]);
        }
    }

    public function down(): void
    {
        // Backfilled slugs are load-bearing public URLs — never take them away.
    }
};
