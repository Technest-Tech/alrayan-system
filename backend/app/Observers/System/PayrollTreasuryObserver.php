<?php

namespace App\Observers\System;

use App\Models\System\Payroll;
use App\Services\System\TreasuryAutoPoster;

/**
 * Takes a salary out of the account set for its currency when the payroll is marked
 * transferred. Bookkeeping failures are reported but never stop the transfer being recorded.
 */
class PayrollTreasuryObserver
{
    public function __construct(private TreasuryAutoPoster $poster) {}

    public function updated(Payroll $payroll): void
    {
        if (! $payroll->wasChanged(['status', 'net_salary_minor', 'currency', 'transferred_at', 'transfer_reference'])) {
            return;
        }

        $moneyJustMoved = $payroll->wasChanged('status') && $payroll->status === 'transferred';

        rescue(fn () => $this->poster->syncPayroll($payroll, $moneyJustMoved));
    }

    public function deleted(Payroll $payroll): void
    {
        rescue(fn () => $this->poster->removeFor(TreasuryAutoPoster::SOURCE_PAYROLL, $payroll->id));
    }

    public function restored(Payroll $payroll): void
    {
        if ($payroll->status === 'transferred') {
            rescue(fn () => $this->poster->restoreFor(TreasuryAutoPoster::SOURCE_PAYROLL, $payroll->id));
        }
    }
}
