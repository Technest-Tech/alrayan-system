<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RevalidateNextPages implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10;

    public function __construct(private array $paths) {}

    public function handle(): void
    {
        $url    = config('services.nextjs.revalidate_url');
        $secret = config('services.nextjs.revalidate_secret');

        $response = Http::withHeaders(['X-Revalidate-Secret' => $secret])
            ->timeout(10)
            ->post($url, ['paths' => $this->paths]);

        if (! $response->successful()) {
            Log::warning('NextRevalidation failed', [
                'status' => $response->status(),
                'paths'  => $this->paths,
            ]);
            $this->fail("Next.js revalidate returned {$response->status()}");
        }
    }
}
