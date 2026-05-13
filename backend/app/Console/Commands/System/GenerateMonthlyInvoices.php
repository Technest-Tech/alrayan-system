<?php

namespace App\Console\Commands\System;

use App\Models\System\Student;
use App\Services\System\InvoiceGenerator;
use App\Services\System\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateMonthlyInvoices extends Command
{
    protected $signature   = 'system:invoices:generate-monthly {--student= : Generate for a specific student ID} {--period= : Override period as YYYY-MM}';
    protected $description = 'Generate monthly invoices for all active students';

    public function handle(InvoiceGenerator $gen): int
    {
        $period = $this->option('period')
            ? Carbon::createFromFormat('Y-m', $this->option('period'))
            : now();
        $year   = $period->year;
        $month  = $period->month;
        $count  = 0;

        $query = Student::where('status', 'active');
        if ($sid = $this->option('student')) {
            $query->where('id', $sid);
        }

        $query->cursor()->each(function ($s) use ($gen, $year, $month, &$count) {
            $inv = $gen->generateMonthly($s, $year, $month);
            if ($inv->wasRecentlyCreated) $count++;
        });

        $this->info("Created {$count} monthly invoices for {$year}-{$month}.");
        NotificationService::pushToAdmins(
            'billing.monthly_run',
            "Monthly invoices generated: {$count}",
            null,
            '/billing/invoices?period=current'
        );
        return self::SUCCESS;
    }
}
