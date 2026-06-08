<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Payment;
use App\Models\System\XPayPaymentLink;
use App\Services\Integrations\XPay\FakeXPayClient;
use App\Services\Integrations\XPay\XPayClient;
use App\Services\System\PaymentRecorder;
use Illuminate\Http\Request;

class XPayWebhookController extends Controller
{
    public function handle(Request $request, PaymentRecorder $recorder)
    {
        $uuid   = $request->input('transaction_uuid');
        $status = $request->input('transaction_status');

        abort_unless($uuid, 422, 'Missing transaction_uuid');

        // Verify by looking up the transaction via XPay API
        $client = config('system.features.xpay', false)
            ? app(XPayClient::class)
            : app(FakeXPayClient::class);

        try {
            $txn = $client->getTransaction($uuid);
        } catch (\Throwable) {
            return response()->json(['ok' => false, 'error' => 'Could not verify transaction'], 422);
        }

        $confirmedStatus = $txn['status'] ?? $status;

        if ($confirmedStatus !== 'SUCCESSFUL') {
            return response()->json(['ok' => true, 'ignored' => 'non_successful']);
        }

        if (Payment::where('gateway_transaction_id', $uuid)->exists()) {
            return response()->json(['ok' => true, 'duplicate' => true]);
        }

        $link = XPayPaymentLink::where('transaction_uuid', $uuid)->where('is_active', true)->first();

        abort_unless($link, 404, 'Payment link not found');

        $invoice = $link->invoice;

        $payment = $recorder->record($invoice, [
            'amount_minor'            => $invoice->total_minor,
            'currency'                => $invoice->currency,
            'method'                  => 'xpay',
            'gateway_transaction_id'  => $uuid,
            'reference'               => "XPay #{$uuid}",
            'paid_at'                 => now(),
            'payload'                 => array_merge($request->all(), [
                'xpay_status'       => $txn['status'] ?? null,
                'xpay_total_amount' => $txn['total_amount'] ?? null,
                'xpay_currency'     => $txn['currency'] ?? null,
            ]),
        ]);

        return response()->json(['ok' => true, 'payment_id' => $payment->id]);
    }
}
