<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Invoice;
use App\Services\System\InvoicePdfRenderer;
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

        return response()->json(['data' => $this->formatInvoice($invoice)]);
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
