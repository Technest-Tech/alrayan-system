<?php

namespace App\Services\Integrations\Paymob;

use App\Models\System\Invoice;
use App\Models\System\PaymobPaymentLink;

class FakePaymobClient
{
    public function createPaymentLink(Invoice $invoice): PaymobPaymentLink
    {
        return PaymobPaymentLink::create([
            'invoice_id'      => $invoice->id,
            'paymob_order_id' => 'fake-' . $invoice->id,
            'payment_url'     => url('/test-paymob-link/' . $invoice->id),
            'expires_at'      => now()->addHours(24),
            'is_active'       => true,
        ]);
    }

    public function authenticate(): string
    {
        return 'fake-token';
    }
}
