<?php

namespace App\Console\Commands\System;

use App\Models\System\SysNotification;
use App\Services\System\NotificationService;
use App\Support\System\NotificationTypes;
use Illuminate\Console\Command;

class NotifyAdminsOnUpcomingPayroll extends Command
{
    protected $signature   = 'system:notify:upcoming-payroll';
    protected $description = 'Remind admins that payroll is due in the last 3 days of the month';

    public function handle(): int
    {
        $today    = now()->day;
        $lastDay  = now()->daysInMonth;
        $daysLeft = $lastDay - $today;

        if ($daysLeft > 3) return self::SUCCESS;

        // Dedupe 24h
        $exists = SysNotification::where('type', NotificationTypes::PAYROLL_UPCOMING_DUE)
            ->where('created_at', '>=', now()->subHours(24))
            ->exists();

        if ($exists) return self::SUCCESS;

        NotificationService::pushToAdmins(
            NotificationTypes::PAYROLL_UPCOMING_DUE,
            "Payroll is due in {$daysLeft} " . str('day')->plural($daysLeft),
            null,
            '/payrolls'
        );

        return self::SUCCESS;
    }
}
