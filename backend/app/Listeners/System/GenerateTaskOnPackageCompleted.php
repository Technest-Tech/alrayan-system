<?php

namespace App\Listeners\System;

use App\Events\System\PackageCompleted;
use App\Services\System\TaskGenerator;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateTaskOnPackageCompleted implements ShouldQueue
{
    public string $queue = 'notifications';

    public function __construct(private TaskGenerator $generator) {}

    public function handle(PackageCompleted $event): void
    {
        $this->generator->forPackageComplete($event->package);
    }
}
