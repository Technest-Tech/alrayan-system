<?php

namespace App\Events\System;

use App\Models\System\Invoice;
use App\Models\System\Payment;
use Illuminate\Foundation\Events\Dispatchable;

class InvoicePaid
{
    use Dispatchable;

    public function __construct(
        public readonly Invoice $invoice,
        public readonly Payment $payment,
    ) {}
}
