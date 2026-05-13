<?php

namespace App\Listeners\System;

use App\Events\System\InvoicePaid;
use App\Services\System\NotificationService;
use App\Services\System\StudentLifecycle;
use App\Services\System\WassenderDispatcher;

class OnInvoicePaid
{
    public function __construct(
        private StudentLifecycle $lifecycle,
        private WassenderDispatcher $wa,
    ) {}

    public function handle(InvoicePaid $event): void
    {
        $inv = $event->invoice;
        $s   = $inv->student;

        if ($inv->type === 'advance' && $s->status === 'trial') {
            $this->lifecycle->transition($s, 'active', ['reason' => 'first_advance_paid', 'invoice' => $inv->invoice_number]);
        }
        if ($inv->type === 'advance' && $s->status === 'paused') {
            $this->lifecycle->transition($s, 'active', ['reason' => 'reactivation_paid', 'invoice' => $inv->invoice_number]);
        }
        if ($inv->type === 'reactivation' && $s->status === 'suspended') {
            $this->lifecycle->transition($s, 'active', ['reason' => 'all_outstanding_paid', 'invoice' => $inv->invoice_number]);
        }

        NotificationService::pushToAdmins(
            'payment.received',
            "{$s->name} paid {$inv->invoice_number}",
            null,
            "/students/{$s->id}/invoices"
        );

        if ($s->whatsapp_group_id) {
            $this->wa->sendTemplate('payment_received', $s->whatsappGroup, [
                'student_name'   => $s->name,
                'invoice_number' => $inv->invoice_number,
            ]);
        }
    }
}
