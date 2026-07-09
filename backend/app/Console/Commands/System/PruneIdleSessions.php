<?php

namespace App\Console\Commands\System;

use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;

class PruneIdleSessions extends Command
{
    protected $signature   = 'system:prune:idle-sessions {--days=90 : Idle threshold in days}';
    protected $description = 'Delete login sessions untouched for N days (default 90)';

    public function handle(): int
    {
        $days = (int) $this->option('days');

        if ($days < 1) {
            $this->error('--days must be at least 1.');
            return self::FAILURE;
        }

        $cutoff = now()->subDays($days);

        // A token that was issued but never used has a null last_used_at, so fall
        // back to created_at rather than treating it as infinitely fresh.
        // Scoped to 'system-session' so integration tokens are never reaped.
        $deleted = PersonalAccessToken::query()
            ->where('name', 'system-session')
            ->whereRaw('COALESCE(last_used_at, created_at) < ?', [$cutoff])
            ->delete();

        $this->info("Pruned {$deleted} session(s) idle since {$cutoff->toDateString()}.");

        return self::SUCCESS;
    }
}
