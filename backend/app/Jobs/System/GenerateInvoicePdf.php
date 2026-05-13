<?php

namespace App\Jobs\System;

use App\Models\System\Invoice;
use App\Services\System\InvoicePdfRenderer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class GenerateInvoicePdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Invoice $invoice) {}

    public function handle(InvoicePdfRenderer $renderer): void
    {
        $content = $renderer->render($this->invoice);
        $path    = "system/invoices/{$this->invoice->invoice_number}.pdf";
        Storage::disk('local')->put($path, $content);
    }
}
