<?php

namespace App\Console\Commands\System;

use App\Models\System\Teacher;
use App\Services\System\PayrollCalculator;
use App\Services\System\PayrollGenerator;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CalculatePayroll extends Command
{
    protected $signature   = 'system:payroll:calculate {--teacher= : Teacher ID to calculate for} {--period= : Period as YYYY-MM}';
    protected $description = 'Generate payrolls for the previous month for all active teachers';

    public function handle(PayrollCalculator $calc, PayrollGenerator $gen): int
    {
        $prev = $this->option('period')
            ? Carbon::createFromFormat('Y-m', $this->option('period'))
            : now()->subMonthNoOverflow();

        $year  = $prev->year;
        $month = $prev->month;
        $start = $prev->copy()->startOfMonth()->utc();
        $end   = $prev->copy()->endOfMonth()->addDay()->startOfDay()->utc();

        $query = Teacher::where('is_active', true);
        if ($this->option('teacher')) {
            $query->where('id', $this->option('teacher'));
        }

        $count = 0;
        $query->cursor()->each(function ($t) use ($gen, $start, $end, $year, $month, &$count) {
            $p = $gen->generate($t, $year, $month, $start, $end);
            if ($p->wasRecentlyCreated) $count++;
        });

        $this->info("Payroll for {$year}-{$month} generated ({$count} new).");
        return self::SUCCESS;
    }
}
