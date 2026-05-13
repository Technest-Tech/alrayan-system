<?php

namespace App\Jobs\System;

use App\Models\System\Invoice;
use App\Models\System\PaymobPaymentLink;
use App\Services\Integrations\Paymob\FakePaymobClient;
use App\Services\Integrations\Paymob\PaymobClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CreatePaymobPaymentLink implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries  = 3;
    public int $backoff = 60;

    public function __construct(public Invoice $invoice) {}

    public function handle(): void
    {
        if (PaymobPaymentLink::where('invoice_id', $this->invoice->id)->where('is_active', true)->exists()) {
            return; // idempotent
        }
        $client = config('system.features.paymob', false)
            ? app(PaymobClient::class)
            : app(FakePaymobClient::class);
        $client->createPaymentLink($this->invoice);
    }
}
