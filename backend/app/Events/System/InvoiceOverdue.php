<?php

namespace App\Events\System;

use App\Models\System\Invoice;
use Illuminate\Foundation\Events\Dispatchable;

class InvoiceOverdue
{
    use Dispatchable;

    public function __construct(public readonly Invoice $invoice) {}
}
