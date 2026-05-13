<?php

namespace App\Events\System;

use App\Models\System\Payroll;

class PayrollApproved
{
    public function __construct(public readonly Payroll $payroll) {}
}
