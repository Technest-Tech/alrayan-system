<?php

namespace App\Jobs\System;

use App\Models\System\Invoice;
use App\Models\System\PaymobPaymentLink;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RegeneratePaymobPaymentLink implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Invoice $invoice) {}

    public function handle(): void
    {
        PaymobPaymentLink::where('invoice_id', $this->invoice->id)->update(['is_active' => false]);
        CreatePaymobPaymentLink::dispatch($this->invoice);
    }
}
