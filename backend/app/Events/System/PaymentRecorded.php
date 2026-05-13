<?php

namespace App\Events\System;

use App\Models\System\Payment;
use Illuminate\Foundation\Events\Dispatchable;

class PaymentRecorded
{
    use Dispatchable;

    public function __construct(public readonly Payment $payment) {}
}
