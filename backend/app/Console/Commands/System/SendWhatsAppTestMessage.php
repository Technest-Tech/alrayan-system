<?php

namespace App\Console\Commands\System;

use App\Services\Integrations\Acadmyq\AcadmyqClient;
use App\Services\System\WhatsAppDispatcher;
use Illuminate\Console\Command;
use InvalidArgumentException;

class SendWhatsAppTestMessage extends Command
{
    protected $signature = 'whatsapp:send
        {--to= : Recipient phone, international format (e.g. 201234567890)}
        {--text= : Text body to send}
        {--image= : Public https image URL to send}
        {--caption= : Caption to accompany --image}';

    protected $description = 'Queue one WhatsApp message through Acadmyq and record it in the send log';

    public function handle(WhatsAppDispatcher $dispatcher, AcadmyqClient $client): int
    {
        $to      = (string) $this->option('to');
        $text    = $this->option('text');
        $image   = $this->option('image');
        $caption = $this->option('caption');

        if ($to === '') {
            $this->error('--to is required.');
            return self::FAILURE;
        }

        if ((bool) $text === (bool) $image) {
            $this->error('Pass exactly one of --text or --image.');
            return self::FAILURE;
        }

        $status = $client->status();
        if (!$status['connected']) {
            $this->warn("WhatsApp is not connected ({$status['status']}) — the send will fail.");
            if (!$this->confirm('Queue it anyway?', false)) {
                return self::FAILURE;
            }
        }

        try {
            $log = $image
                ? $dispatcher->sendImage($to, $image, $caption)
                : $dispatcher->sendText($to, (string) $text);
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $this->info("Queued log #{$log->id} to {$log->recipient_phone} (key {$log->idempotency_key}).");
        $this->line('Watch it settle at /whatsapp/logs, or: php artisan queue:work --once');

        return self::SUCCESS;
    }
}
