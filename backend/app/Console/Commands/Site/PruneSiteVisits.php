<?php

namespace App\Console\Commands\Site;

use App\Models\SiteVisit;
use Illuminate\Console\Command;

class PruneSiteVisits extends Command
{
    protected $signature   = 'site:prune:visits {--days=400 : Retention window in days}';
    protected $description = 'Delete site traffic rows older than N days (default 400)';

    public function handle(): int
    {
        $days = (int) $this->option('days');

        if ($days < 1) {
            $this->error('--days must be at least 1.');
            return self::FAILURE;
        }

        $cutoff = now()->subDays($days);

        // A year plus change keeps every year-on-year comparison the dashboard
        // can draw, and drops the rest — this table grows with every page view.
        // Deleted in chunks so a long-neglected table cannot lock up the site.
        $deleted = 0;
        do {
            $batch = SiteVisit::where('created_at', '<', $cutoff)->limit(5000)->delete();
            $deleted += $batch;
        } while ($batch > 0);

        $this->info("Pruned {$deleted} site visit(s) recorded before {$cutoff->toDateString()}.");

        return self::SUCCESS;
    }
}
