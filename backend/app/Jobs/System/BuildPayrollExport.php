<?php

namespace App\Jobs\System;

use App\Models\System\Payroll;
use App\Models\User;
use App\Services\System\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class BuildPayrollExport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $period,
        public string $format,
        public int    $userId,
    ) {
        $this->onQueue('reports');
    }

    public function handle(): void
    {
        [$year, $month] = explode('-', $this->period);
        $payrolls = Payroll::where('period_year', $year)
            ->where('period_month', $month)
            ->with(['teacher.user', 'adjustments'])
            ->get();

        // Build CSV export inline (Excel/XLSX export via Maatwebsite queued in a future improvement)
        $rows = [['Teacher', 'Sessions', 'Minutes', 'Base (minor)', 'Bonuses (minor)', 'Deductions (minor)', 'Net (minor)', 'Status']];
        foreach ($payrolls as $p) {
            $rows[] = [
                $p->teacher->user->name,
                $p->total_sessions,
                $p->total_minutes,
                $p->base_salary_minor,
                $p->bonuses_minor,
                $p->deductions_minor,
                $p->net_salary_minor,
                $p->status,
            ];
        }

        $user = User::find($this->userId);
        if ($user) {
            NotificationService::push($user, 'payroll.export_ready', 'Payroll export ready', "Period: {$this->period}", null);
        }
    }
}
