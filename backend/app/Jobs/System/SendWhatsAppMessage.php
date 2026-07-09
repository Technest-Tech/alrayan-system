<?php

namespace App\Jobs\System;

use App\Models\System\WhatsAppSendLog;
use App\Services\Integrations\Acadmyq\AcadmyqClient;
use App\Services\Integrations\Acadmyq\WhatsAppSendResult;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use RuntimeException;
use Throwable;

class SendWhatsAppMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 4;

    public function __construct(public int $logId) {}

    /** @return list<int> */
    public function backoff(): array
    {
        return [30, 120, 300];
    }

    public function handle(AcadmyqClient $client): void
    {
        $log = WhatsAppSendLog::find($this->logId);

        if (!$log || $log->settled()) {
            return;
        }

        $log->increment('attempt_count');

        $result = $log->image_url
            ? $client->sendImage($log->recipient_phone, $log->image_url, $log->caption, $log->idempotency_key)
            : $client->sendText($log->recipient_phone, (string) $log->body, $log->idempotency_key);

        if ($result->ok()) {
            $log->update([
                'status'              => $result->status,
                'provider_message_id' => $result->messageId,
                'http_status'         => $result->httpStatus,
                'error'               => null,
            ]);

            return;
        }

        // Keep the row QUEUED while attempts remain, so the log page doesn't
        // flash FAILED for a send that is still going to be retried.
        $log->update([
            'status'      => $result->retryable() ? WhatsAppSendLog::STATUS_QUEUED : WhatsAppSendLog::STATUS_FAILED,
            'http_status' => $result->httpStatus,
            'error'       => $result->error,
        ]);

        $message = sprintf(
            'Acadmyq send failed for log #%d (HTTP %s): %s',
            $log->id,
            $result->httpStatus ?? 'none',
            $result->error,
        );

        if ($result->retryable()) {
            throw new RuntimeException($message);
        }

        $this->fail(new RuntimeException($message));
    }

    public function failed(Throwable $e): void
    {
        WhatsAppSendLog::where('id', $this->logId)
            ->whereNotIn('status', [WhatsAppSendLog::STATUS_ACCEPTED, WhatsAppSendLog::STATUS_DUPLICATE])
            ->update([
                'status' => WhatsAppSendLog::STATUS_FAILED,
                'error'  => $e->getMessage(),
            ]);
    }
}
