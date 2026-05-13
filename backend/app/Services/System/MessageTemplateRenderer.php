<?php

namespace App\Services\System;

use App\Models\System\MessageTemplate;

class MessageTemplateRenderer
{
    public function render(MessageTemplate $template, array $variables): string
    {
        $allowed = $template->available_variables ?? [];
        $out = $template->body;

        foreach ($allowed as $name) {
            $value = $this->safe($variables[$name] ?? '');
            $out = str_replace('{' . $name . '}', $value, $out);
        }

        // Strip any remaining {tokens} so users never see unfilled placeholders
        $out = preg_replace('/\{[a-z_]+\}/i', '', $out);

        return trim($out);
    }

    // Strip control chars; wassender uses plain text so no HTML escaping
    private function safe(string $v): string
    {
        return preg_replace('/[\x00-\x1F\x7F]/u', '', $v);
    }
}
