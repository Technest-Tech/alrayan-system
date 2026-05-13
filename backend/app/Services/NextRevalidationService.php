<?php

namespace App\Services;

use App\Jobs\RevalidateNextPages;

class NextRevalidationService
{
    public function revalidate(array $paths): void
    {
        if (empty($paths) || ! config('services.nextjs.revalidate_url')) {
            return;
        }

        RevalidateNextPages::dispatch($paths);
    }
}
