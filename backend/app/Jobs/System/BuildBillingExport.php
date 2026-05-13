<?php

namespace App\Jobs\System;

use App\Services\System\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class BuildBillingExport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public array  $filters,
        public string $format,
        public int    $userId,
    ) {}

    public function handle(): void
    {
        // Export logic reserved — triggers notification when complete
        NotificationService::pushToAdmins(
            'billing.export_ready',
            'Billing export is ready for download.',
            null,
            '/billing/invoices'
        );
    }
}
