<?php

namespace App\Jobs\System;

use App\Models\System\Invoice;
use App\Models\System\XPayPaymentLink;
use App\Services\Integrations\XPay\FakeXPayClient;
use App\Services\Integrations\XPay\XPayClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CreateXPayPaymentLink implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries  = 3;
    public int $backoff = 60;

    public function __construct(public Invoice $invoice) {}

    public function handle(): void
    {
        if (XPayPaymentLink::where('invoice_id', $this->invoice->id)->where('is_active', true)->exists()) {
            return; // idempotent
        }

        $client = config('system.features.xpay', false)
            ? app(XPayClient::class)
            : app(FakeXPayClient::class);

        $client->createPaymentLink($this->invoice);
    }
}
