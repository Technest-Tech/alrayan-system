<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration
{
    /**
     * Backfill `users` rows for students created without one (the pre-provisioning
     * lead-conversion path left some students orphaned, so they never appeared in
     * the user directory). Delegates to the idempotent command so the same logic
     * can also be re-run manually. Safe no-op when there are no orphans.
     */
    public function up(): void
    {
        Artisan::call('system:students:backfill-users');
    }

    public function down(): void
    {
        // Non-reversible data backfill; the original 2026_09_20_000008 down() already
        // handles unlinking synthesized student users if a full rollback is needed.
    }
};
