<?php

namespace App\Services\System;

use App\Jobs\System\SendWassenderMessage;
use App\Models\System\MessageTemplate;
use App\Models\System\WassenderLog;
use App\Models\System\WhatsAppGroup;
use App\Services\Integrations\Wassender\WassenderClient;

class WassenderDispatcher
{
    public function __construct(
        private WassenderClient $client,
        private MessageTemplateRenderer $renderer,
    ) {}

    public function sendTemplate(string $templateKey, WhatsAppGroup $group, array $variables): WassenderLog
    {
        $template = MessageTemplate::where('key', $templateKey)->where('is_active', true)->firstOrFail();
        $rendered = $this->renderer->render($template, $variables);

        $log = WassenderLog::create([
            'template_key'      => $templateKey,
            'whatsapp_group_id' => $group->id,
            'rendered_message'  => $rendered,
            'status'            => 'queued',
            'payload'           => ['variables' => $variables],
        ]);

        SendWassenderMessage::dispatch($log->id)->onQueue('notifications');

        return $log;
    }

    public function sendRaw(WhatsAppGroup $group, string $message, ?string $templateKey = null): WassenderLog
    {
        $log = WassenderLog::create([
            'template_key'      => $templateKey,
            'whatsapp_group_id' => $group->id,
            'rendered_message'  => $message,
            'status'            => 'queued',
        ]);

        SendWassenderMessage::dispatch($log->id)->onQueue('notifications');

        return $log;
    }
}
