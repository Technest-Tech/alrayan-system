<?php

namespace App\Services\System;

use App\Models\System\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoicePdfRenderer
{
    public function render(Invoice $invoice): string
    {
        $invoice->loadMissing(['student', 'lines', 'payments']);
        $pdf = Pdf::loadView('system.pdf.invoice', ['invoice' => $invoice])
            ->setPaper('a4', 'portrait');
        return $pdf->output();
    }

    public function path(Invoice $invoice): string
    {
        return storage_path("app/system/invoices/{$invoice->invoice_number}.pdf");
    }
}
