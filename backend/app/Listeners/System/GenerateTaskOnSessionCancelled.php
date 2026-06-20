<?php

namespace App\Listeners\System;

use App\Events\System\SessionCancelled;
use App\Services\System\TaskGenerator;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateTaskOnSessionCancelled implements ShouldQueue
{
    public string $queue = 'notifications';

    public function __construct(private TaskGenerator $generator) {}

    public function handle(SessionCancelled $event): void
    {
        $this->generator->forSessionCancelled($event->session);
    }
}
