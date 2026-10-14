<?php

namespace App\Observers\System;

use App\Models\System\StudentPackage;
use App\Services\System\TeacherNotifier;

/**
 * Tells the teacher when a package is paid — on the transition to `paid`, whether it came from
 * "Mark as paid" or the edit row. A package CREATED paid is the enrolment down payment opening
 * (which happens at a trial lesson too), not a payment, so creation is deliberately ignored.
 */
class StudentPackageObserver
{
    public function __construct(private TeacherNotifier $notifier) {}

    public function updated(StudentPackage $package): void
    {
        if ($package->wasChanged('status') && $package->status === 'paid') {
            $this->notifier->packagePaid($package);
        }
    }
}
