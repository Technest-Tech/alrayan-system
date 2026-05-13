<?php

namespace App\Jobs\System;

use App\Models\System\WassenderLog;
use App\Services\Integrations\Wassender\WassenderClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWassenderMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public int $logId) {}

    public function handle(WassenderClient $client): void
    {
        $log = WassenderLog::findOrFail($this->logId);

        if ($log->status === 'sent') return;

        $log->update(['status' => 'sending', 'attempt_count' => $log->attempt_count + 1]);

        $group = $log->whatsappGroup;

        if (!$group) {
            $log->update(['status' => 'failed', 'error' => 'WhatsApp group not found']);
            return;
        }

        $result = $client->sendToGroup($group, $log->rendered_message);

        if ($result->success) {
            $log->update([
                'status'              => 'sent',
                'external_message_id' => $result->externalId,
                'sent_at'             => now(),
                'error'               => null,
            ]);
        } else {
            $log->update([
                'status' => 'failed',
                'error'  => "HTTP {$result->statusCode}: {$result->errorBody}",
            ]);
            $this->fail("Wassender send failed: HTTP {$result->statusCode}");
        }
    }

    public function failed(\Throwable $e): void
    {
        WassenderLog::where('id', $this->logId)
            ->where('status', '!=', 'sent')
            ->update(['status' => 'dead', 'error' => $e->getMessage()]);
    }
}
