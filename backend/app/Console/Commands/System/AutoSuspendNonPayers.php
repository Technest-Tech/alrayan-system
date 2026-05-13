<?php

namespace App\Console\Commands\System;

use App\Models\System\Student;
use App\Services\System\NotificationService;
use App\Services\System\StudentLifecycle;
use App\Support\System\Setting;
use Illuminate\Console\Command;

class AutoSuspendNonPayers extends Command
{
    protected $signature   = 'system:students:auto-suspend';
    protected $description = 'Suspend students who have unpaid invoices past the threshold';

    public function handle(StudentLifecycle $lifecycle): int
    {
        $months  = Setting::int('invoice.suspend_after_months', 2);
        $cutoff  = now()->subMonthsNoOverflow($months);
        $suspended = 0;

        Student::where('status', 'active')->cursor()->each(function ($s) use (&$suspended, $cutoff, $lifecycle) {
            $oldest = $s->invoices()->whereIn('status', ['sent', 'overdue'])
                ->where('issued_at', '<=', $cutoff)
                ->oldest('issued_at')
                ->first();
            if (!$oldest) return;
            $lifecycle->transition($s, 'suspended', [
                'reason'        => 'auto_non_payment',
                'oldest_unpaid' => $oldest->invoice_number,
                'months_overdue'=> $oldest->issued_at->diffInMonths(now()),
            ]);
            NotificationService::pushToAdmins(
                'student.auto_suspended',
                "{$s->name} auto-suspended for non-payment",
                null,
                "/students/{$s->id}"
            );
            $suspended++;
        });

        $this->info("Auto-suspended {$suspended} students.");
        return self::SUCCESS;
    }
}
