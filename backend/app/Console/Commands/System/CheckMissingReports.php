<?php

namespace App\Console\Commands\System;

use App\Services\System\ReportSubmissionMonitor;
use Illuminate\Console\Command;

class CheckMissingReports extends Command
{
    protected $signature = 'system:reports:check';

    protected $description = 'Notify admins of session reports overdue past the configured threshold';

    public function handle(ReportSubmissionMonitor $monitor): int
    {
        $count = $monitor->checkOverdue();
        $this->info("Flagged {$count} overdue session report(s).");
        return self::SUCCESS;
    }
}
