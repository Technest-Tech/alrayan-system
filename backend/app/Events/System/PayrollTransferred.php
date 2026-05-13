<?php

namespace App\Events\System;

use App\Models\System\Payroll;

class PayrollTransferred
{
    public function __construct(public readonly Payroll $payroll) {}
}
