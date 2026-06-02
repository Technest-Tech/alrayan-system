<?php

namespace App\Services\System;

use App\Models\System\Invoice;
use App\Models\System\Session;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class InvoicePdfRenderer
{
    public function render(Invoice $invoice): string
    {
        $invoice->loadMissing(['student', 'payments']);

        // Build the session breakdown (mirrors InvoiceController::sessions so
        // the PDF tells the student exactly what they're paying for).
        $breakdown = $this->buildSessionBreakdown($invoice);

        $pdf = Pdf::loadView('system.pdf.invoice', [
            'invoice'  => $invoice,
            'sessions' => $breakdown['sessions'],
            'meta'     => $breakdown['meta'],
        ])->setPaper('a4', 'portrait');

        return $pdf->output();
    }

    public function path(Invoice $invoice): string
    {
        return storage_path("app/system/invoices/{$invoice->invoice_number}.pdf");
    }

    /**
     * Returns the same shape as InvoiceController::sessions() so the PDF and
     * the UI invoice detail page stay perfectly aligned.
     */
    private function buildSessionBreakdown(Invoice $invoice): array
    {
        $student = $invoice->student;
        if (!$student) {
            return ['sessions' => collect(), 'meta' => $this->emptyMeta($invoice)];
        }

        if ($invoice->period_year && $invoice->period_month) {
            $start = Carbon::create($invoice->period_year, $invoice->period_month, 1)->startOfMonth();
        } else {
            $start = ($invoice->issued_at ?? $invoice->created_at ?? now())->copy()->startOfMonth();
        }
        $end = (clone $start)->endOfMonth();

        $sessions = Session::with(['teacher.user', 'report'])
            ->where('student_id', $student->id)
            ->whereBetween('scheduled_start', [$start, $end])
            ->orderBy('scheduled_start')
            ->get();

        $perSessionMinor = 0;
        if ($student->sessions_per_month > 0) {
            $perSessionMinor = (int) floor(
                ($invoice->subtotal_minor > 0 ? $invoice->subtotal_minor : $student->monthly_price_minor)
                / max($student->sessions_per_month, 1)
            );
        }

        $counted = 0;
        $free    = 0;
        $rows = $sessions->map(function (Session $s) use ($perSessionMinor, &$counted, &$free) {
            $counts = $s->counts_against_quota;
            if ($counts) $counted++; else $free++;
            return (object) [
                'scheduled_start' => $s->scheduled_start,
                'duration_min'    => $s->duration_min,
                'status'          => $s->status,
                'cancelled_by'    => $s->cancelled_by,
                'quota_impact'    => $s->quota_impact,
                'counts'          => $counts,
                'teacher_name'    => optional($s->teacher?->user)->name,
                'cost_minor'      => $counts ? $perSessionMinor : 0,
            ];
        });

        return [
            'sessions' => $rows,
            'meta'     => [
                'counted'                 => $counted,
                'free'                    => $free,
                'per_session_price_minor' => $perSessionMinor,
                'total_cost_minor'        => $counted * $perSessionMinor,
                'currency'                => $invoice->currency,
                'period_start'            => $start,
                'period_end'              => $end,
            ],
        ];
    }

    private function emptyMeta(Invoice $invoice): array
    {
        return [
            'counted' => 0, 'free' => 0,
            'per_session_price_minor' => 0,
            'total_cost_minor' => 0,
            'currency' => $invoice->currency,
            'period_start' => null,
            'period_end'   => null,
        ];
    }
}
