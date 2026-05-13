<?php

namespace App\Console\Commands\System;

use App\Services\System\MonthlyReportGenerator;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateMonthlyReport extends Command
{
    protected $signature   = 'system:reports:monthly {--year= : Year (defaults to previous month)} {--month= : Month (defaults to previous month)}';
    protected $description = 'Generate the monthly financial report (runs automatically on the 1st of each month)';

    public function handle(MonthlyReportGenerator $generator): int
    {
        $target = $this->option('year') && $this->option('month')
            ? Carbon::create((int) $this->option('year'), (int) $this->option('month'), 1)
            : now()->subMonth();

        $year  = (int) $target->format('Y');
        $month = (int) $target->format('m');

        $this->info("Generating monthly report for {$target->format('F Y')}…");

        $report = $generator->generate($year, $month);

        $this->info("Done. Report ID: {$report->id}  Period: {$report->period_year}-{$report->period_month}");

        return Command::SUCCESS;
    }
}
