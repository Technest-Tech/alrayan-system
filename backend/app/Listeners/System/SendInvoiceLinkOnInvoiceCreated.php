<?php

namespace App\Listeners\System;

use App\Events\System\InvoiceCreated;
use App\Services\System\WassenderDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendInvoiceLinkOnInvoiceCreated implements ShouldQueue
{
    public string $queue = 'notifications';

    public function __construct(private WassenderDispatcher $wa) {}

    public function handle(InvoiceCreated $event): void
    {
        $invoice = $event->invoice;
        $student = $invoice->student;

        if (!$student?->whatsapp_group_id) return;

        $log = $this->wa->sendTemplate('payment_due_soon', $student->whatsappGroup, [
            'student_name'         => $student->name,
            'invoice_number'       => $invoice->invoice_number,
            'amount_with_currency' => number_format($invoice->total_minor / 100, 2) . ' ' . $invoice->currency,
            'due_date'             => $invoice->due_at?->toDateString() ?? '',
            'payment_link'         => optional($invoice->paymobLink)->payment_url ?? '',
            'days_until_due'       => (string) max(0, now()->diffInDays($invoice->due_at, false)),
        ]);

        $log->update(['payload' => array_merge($log->payload ?? [], ['invoice_id' => $invoice->id])]);
    }
}
