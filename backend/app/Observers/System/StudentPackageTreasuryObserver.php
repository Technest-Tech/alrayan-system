<?php

namespace App\Observers\System;

use App\Models\System\StudentPackage;
use App\Services\System\TreasuryAutoPoster;

/**
 * Deposits a package's price into the account set for its currency when it's paid.
 *
 * A package CREATED paid is the enrolment down payment opening, which happens at a trial lesson
 * with no money received, so creation is ignored; LeadToStudentConverter posts it when the lead
 * closes and the money is collected. Bookkeeping failures are reported but never stop a package
 * being marked paid.
 */
class StudentPackageTreasuryObserver
{
    public function __construct(private TreasuryAutoPoster $poster) {}

    public function updated(StudentPackage $package): void
    {
        if (! $package->wasChanged(['status', 'paid_at', 'tariff_at_time', 'currency', 'package_number'])) {
            return;
        }

        // Renumbering a legacy package into #0 stamps it paid in the same save: not a payment.
        $moneyJustMoved = $package->wasChanged('status')
            && $package->status === 'paid'
            && ! $package->wasChanged('package_number');

        rescue(fn () => $this->poster->syncPackage($package, $moneyJustMoved));
    }

    public function deleted(StudentPackage $package): void
    {
        rescue(fn () => $this->poster->removeFor(TreasuryAutoPoster::SOURCE_PACKAGE, $package->id));
    }

    public function restored(StudentPackage $package): void
    {
        if ($package->status === 'paid') {
            rescue(fn () => $this->poster->restoreFor(TreasuryAutoPoster::SOURCE_PACKAGE, $package->id));
        }
    }
}
