<?php

namespace App\Services\Integrations\XPay;

use App\Models\System\Invoice;
use App\Models\System\XPayPaymentLink;

class FakeXPayClient extends XPayClient
{
    public function prepareAmount(int $amountMinor, string $currency): float
    {
        return $amountMinor / 100;
    }

    public function createPaymentLink(Invoice $invoice): XPayPaymentLink
    {
        return XPayPaymentLink::create([
            'invoice_id'       => $invoice->id,
            'transaction_uuid' => 'fake-' . $invoice->id . '-' . uniqid(),
            'transaction_id'   => null,
            'iframe_url'       => url('/test-xpay-link/' . $invoice->id),
            'expires_at'       => now()->addHours(24),
            'is_active'        => true,
        ]);
    }

    public function getTransaction(string $transactionUuid): array
    {
        return [
            'uuid'   => $transactionUuid,
            'status' => 'SUCCESSFUL',
        ];
    }
}
