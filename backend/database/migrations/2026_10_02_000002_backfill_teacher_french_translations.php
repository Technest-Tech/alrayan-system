<?php

use Database\Seeders\TeacherFrenchTranslationSeeder;
use Illuminate\Database\Migrations\Migration;

/**
 * Runs the French backfill as part of `php artisan migrate`, because the
 * production deploy script only runs migrations — never `db:seed`. Without
 * this, the `_fr` columns added by the previous migration would stay NULL in
 * production and every French teacher page would fall back to English.
 *
 * The seeder only fills columns that are currently NULL, so this is safe to
 * run on a database where an admin has already entered French by hand.
 */
return new class extends Migration
{
    public function up(): void
    {
        (new TeacherFrenchTranslationSeeder())->run();
    }

    public function down(): void
    {
        // Nothing to undo: the `_fr` columns are dropped by the migration that
        // created them, and we must not destroy French an admin may have edited.
    }
};
