<?php

use App\Console\Commands\System\AutoSuspendNonPayers;
use App\Console\Commands\System\GenerateMonthlyReport;
use App\Console\Commands\System\CalculatePayroll;
use App\Console\Commands\System\CheckMissingReports;
use App\Console\Commands\System\CheckMissingWhatsAppGroups;
use App\Console\Commands\System\CheckTrialFollowUpsNeeded;
use App\Console\Commands\System\DispatchPaymentReminders;
use App\Console\Commands\System\DispatchSessionReminders;
use App\Console\Commands\System\GenerateMonthlyInvoices;
use App\Console\Commands\System\MarkInvoicesOverdue;
use App\Console\Commands\System\MaterializeUpcomingSessions;
use App\Console\Commands\System\NotifyAdminsOnUpcomingPayroll;
use App\Console\Commands\System\RecomputeQualityScores;
use App\Console\Commands\System\SweepDueLeadFollowUps;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// SYS-04 scheduled commands
Schedule::command(MaterializeUpcomingSessions::class)->dailyAt('02:00');
Schedule::command(CheckMissingReports::class)->everyFifteenMinutes();

// SYS-05 scheduled commands
Schedule::command(GenerateMonthlyInvoices::class)->monthlyOn(1, '00:30');
Schedule::command(AutoSuspendNonPayers::class)->hourly();
Schedule::command(MarkInvoicesOverdue::class)->hourly();

// SYS-06 scheduled commands
Schedule::command(CalculatePayroll::class)->cron('0 1 1 * *')->onOneServer();
Schedule::command(RecomputeQualityScores::class)->weeklyOn(1, '02:00')->onOneServer();

// SYS-07 scheduled commands
Schedule::command(DispatchSessionReminders::class)->everyMinute()->withoutOverlapping();
Schedule::command(DispatchPaymentReminders::class)->everyFiveMinutes()->withoutOverlapping();
Schedule::command(SweepDueLeadFollowUps::class)->everyMinute()->withoutOverlapping();
Schedule::command(CheckTrialFollowUpsNeeded::class)->dailyAt('08:00');
Schedule::command(CheckMissingWhatsAppGroups::class)->dailyAt('09:00');
Schedule::command(NotifyAdminsOnUpcomingPayroll::class)->dailyAt('10:00');

// SYS-08 scheduled commands
Schedule::command(GenerateMonthlyReport::class)->cron('0 4 1 * *')->onOneServer();
