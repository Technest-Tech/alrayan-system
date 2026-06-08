<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Invoice;
use App\Models\System\Payment;
use App\Models\System\XPayPaymentLink;
use App\Services\Integrations\XPay\FakeXPayClient;
use App\Services\Integrations\XPay\XPayClient;
use App\Services\System\InvoicePdfRenderer;
use App\Services\System\PaymentRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PublicInvoiceController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $invoice = Invoice::where('payment_token', $token)
            ->with(['student', 'lines'])
            ->first();

        if (!$invoice) {
            throw new NotFoundHttpException('Payment link not found.');
        }

        // If unpaid but an XPay link exists, verify the transaction and auto-record if SUCCESSFUL.
        // This handles the case where XPay's webhook/callback was never delivered to us.
        if (!in_array($invoice->status, ['paid', 'void'])) {
            $this->healFromXPay($invoice);
            $invoice = $invoice->fresh(['student', 'lines']);
        }

        return response()->json(['data' => $this->formatInvoice($invoice)]);
    }

    private function healFromXPay(Invoice $invoice): void
    {
        $link = XPayPaymentLink::where('invoice_id', $invoice->id)
            ->where('is_active', true)
            ->whereNotNull('transaction_uuid')
            ->latest()
            ->first();

        if (!$link) return;

        // Skip if this transaction was already recorded
        if (Payment::where('gateway_transaction_id', $link->transaction_uuid)->exists()) return;

        try {
            $client = config('system.features.xpay', false)
                ? app(XPayClient::class)
                : app(FakeXPayClient::class);

            $txn = $client->getTransaction($link->transaction_uuid);

            if (($txn['status'] ?? '') !== 'SUCCESSFUL') return;

            // XPay may return EGP amounts even when invoice is in another currency.
            // We record in the invoice's own currency and store XPay amounts in the payload for audit.
            app(PaymentRecorder::class)->record($invoice, [
                'amount_minor'           => $invoice->total_minor,
                'currency'               => $invoice->currency,
                'method'                 => 'xpay',
                'gateway_transaction_id' => $link->transaction_uuid,
                'paid_at'                => now(),
                'payload'                => [
                    'source'                 => 'self_heal',
                    'xpay_status'            => $txn['status'],
                    'xpay_total_amount'      => $txn['total_amount'] ?? null,
                    'xpay_currency'          => $txn['currency'] ?? null,
                ],
            ]);
        } catch (\Throwable) {
            // Never fail the page load due to a payment verification error
        }
    }

    public function pdf(string $token, InvoicePdfRenderer $renderer): Response
    {
        $invoice = Invoice::where('payment_token', $token)
            ->with(['student', 'lines'])
            ->first();

        if (!$invoice) {
            throw new NotFoundHttpException('Payment link not found.');
        }

        $content = $renderer->render($invoice);

        return response($content, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $invoice->invoice_number . '.pdf"',
        ]);
    }

    public function initiate(string $token): JsonResponse
    {
        $invoice = Invoice::where('payment_token', $token)
            ->with('student')
            ->first();

        abort_unless($invoice, 404, 'Payment link not found.');
        abort_unless(in_array($invoice->status, ['sent', 'overdue']), 422, 'Invoice is not payable.');

        // Return existing active link if still valid
        $existing = XPayPaymentLink::where('invoice_id', $invoice->id)
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if ($existing) {
            return response()->json([
                'iframe_url'       => $existing->iframe_url,
                'transaction_uuid' => $existing->transaction_uuid,
            ]);
        }

        // Create a new XPay payment link
        $client = config('system.features.xpay', false)
            ? app(XPayClient::class)
            : app(FakeXPayClient::class);

        $link = $client->createPaymentLink($invoice);

        return response()->json([
            'iframe_url'       => $link->iframe_url,
            'transaction_uuid' => $link->transaction_uuid,
        ]);
    }

    private function formatInvoice(Invoice $invoice): array
    {
        $snap = $invoice->snapshot ?? [];

        return [
            'invoice_number'      => $invoice->invoice_number,
            'type'                => $invoice->type,
            'currency'            => $invoice->currency,
            'subtotal_minor'      => $invoice->subtotal_minor,
            'discount_minor'      => $invoice->discount_minor,
            'wallet_credit_minor' => $invoice->wallet_credit_minor,
            'total_minor'         => $invoice->total_minor,
            'status'              => $invoice->status,
            'issued_at'           => $invoice->issued_at?->toISOString(),
            'due_at'              => $invoice->due_at?->toISOString(),
            'paid_at'             => $invoice->paid_at?->toISOString(),
            'student_name'        => $invoice->student?->name ?? $snap['student_name'] ?? null,
            'course_name'         => $snap['course_name'] ?? null,
            'teacher_name'        => $snap['teacher_name'] ?? null,
            'sessions_per_month'  => $snap['sessions_per_month'] ?? null,
            'session_duration_min'=> $snap['session_duration_min'] ?? null,
            'description'         => $snap['description'] ?? null,
            'lines'               => $invoice->lines->map(fn($l) => [
                'description'          => $l->description,
                'kind'                 => $l->kind,
                'quantity'             => $l->quantity,
                'session_duration_min' => $l->session_duration_min,
                'unit_price_minor'     => $l->unit_price_minor,
                'line_total_minor'     => $l->line_total_minor,
            ])->values(),
        ];
    }
}
