<?php

namespace App\Listeners\System;

use App\Events\System\InvoiceOverdue;

class OnInvoiceOverdue
{
    public function handle(InvoiceOverdue $event): void
    {
        // Reserved for SYS-07 WhatsApp reminder wiring
    }
}
