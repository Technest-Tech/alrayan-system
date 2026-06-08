<?php

namespace App\Jobs\System;

use App\Models\System\Invoice;
use App\Models\System\XPayPaymentLink;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RegenerateXPayPaymentLink implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Invoice $invoice) {}

    public function handle(): void
    {
        XPayPaymentLink::where('invoice_id', $this->invoice->id)->update(['is_active' => false]);
        CreateXPayPaymentLink::dispatch($this->invoice);
    }
}
