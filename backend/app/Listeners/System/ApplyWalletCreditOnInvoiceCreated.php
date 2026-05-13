<?php

namespace App\Listeners\System;

use App\Events\System\InvoiceCreated;

class ApplyWalletCreditOnInvoiceCreated
{
    public function handle(InvoiceCreated $event): void
    {
        // Wallet credit is applied inline in InvoiceGenerator; hook reserved for extensions
    }
}
