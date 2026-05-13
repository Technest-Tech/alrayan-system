<?php

namespace App\Console\Commands\System;

use App\Events\System\InvoiceOverdue;
use App\Models\System\Invoice;
use Illuminate\Console\Command;

class MarkInvoicesOverdue extends Command
{
    protected $signature   = 'system:invoices:mark-overdue';
    protected $description = 'Mark all past-due sent invoices as overdue';

    public function handle(): int
    {
        $invoices = Invoice::where('status', 'sent')->where('due_at', '<', now())->get();
        foreach ($invoices as $invoice) {
            $invoice->update(['status' => 'overdue']);
            event(new InvoiceOverdue($invoice));
        }
        $this->info("Marked {$invoices->count()} invoices as overdue.");
        return self::SUCCESS;
    }
}
