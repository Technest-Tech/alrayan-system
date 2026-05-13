<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Payment;
use App\Models\System\PaymobPaymentLink;
use App\Services\Integrations\Paymob\PaymobHmacVerifier;
use App\Services\System\PaymentRecorder;
use Illuminate\Http\Request;

class PaymobWebhookController extends Controller
{
    public function handle(Request $request, PaymobHmacVerifier $verifier, PaymentRecorder $recorder)
    {
        $sig = $request->query('hmac');
        abort_unless($sig && $verifier->verify($request, $sig), 401, 'Invalid HMAC signature');

        $payload = $request->input('obj', $request->all());
        $txnId   = (string) ($payload['id'] ?? '');
        $orderId = (string) ($payload['order']['id'] ?? '');
        $isPaid  = (bool) ($payload['success'] ?? false);
        $amount  = (int) ($payload['amount_cents'] ?? 0);

        abort_unless($txnId && $orderId, 422, 'Missing transaction or order ID');

        if (Payment::where('paymob_transaction_id', $txnId)->exists()) {
            return response()->json(['ok' => true, 'duplicate' => true]);
        }

        $link = PaymobPaymentLink::where('paymob_order_id', $orderId)->where('is_active', true)->first();
        abort_unless($link, 404, 'Payment link not found');

        if (!$isPaid) {
            return response()->json(['ok' => true, 'ignored' => 'failed_payment']);
        }

        $payment = $recorder->record($link->invoice, [
            'amount_minor'          => $amount,
            'currency'              => $link->invoice->currency,
            'method'                => 'paymob',
            'paymob_transaction_id' => $txnId,
            'reference'             => "Paymob #{$txnId}",
            'paid_at'               => now(),
            'payload'               => $payload,
        ]);

        return response()->json(['ok' => true, 'payment_id' => $payment->id]);
    }
}
