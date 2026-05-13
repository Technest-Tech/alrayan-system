<?php

namespace App\Events\System;

use App\Models\System\Invoice;
use Illuminate\Foundation\Events\Dispatchable;

class InvoiceVoided
{
    use Dispatchable;

    public function __construct(public readonly Invoice $invoice) {}
}
