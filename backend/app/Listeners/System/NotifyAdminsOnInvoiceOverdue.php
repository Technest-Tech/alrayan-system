<?php

namespace App\Listeners\System;

use App\Events\System\InvoiceOverdue;
use App\Models\System\SysNotification;
use App\Services\System\NotificationService;
use App\Support\System\NotificationTypes;
use Illuminate\Contracts\Queue\ShouldQueue;

class NotifyAdminsOnInvoiceOverdue implements ShouldQueue
{
    public string $queue = 'notifications';

    public function handle(InvoiceOverdue $event): void
    {
        $invoice = $event->invoice;

        // Dedupe 24h per invoice
        $exists = SysNotification::where('type', NotificationTypes::INVOICE_OVERDUE)
            ->where('link', "/invoices/{$invoice->id}")
            ->where('created_at', '>=', now()->subHours(24))
            ->exists();

        if ($exists) return;

        NotificationService::pushToAdmins(
            NotificationTypes::INVOICE_OVERDUE,
            "Invoice {$invoice->invoice_number} is overdue — {$invoice->student?->name}",
            null,
            "/invoices/{$invoice->id}"
        );
    }
}
