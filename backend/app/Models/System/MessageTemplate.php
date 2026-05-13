<?php

namespace App\Models\System;

use App\Services\System\MessageTemplateRenderer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageTemplate extends Model
{
    protected $table = 'sys_message_templates';

    protected $guarded = [];

    protected $casts = [
        'available_variables' => 'array',
        'example_values'      => 'array',
        'is_active'           => 'boolean',
    ];

    public function render(array $variables): string
    {
        return app(MessageTemplateRenderer::class)->render($this, $variables);
    }

    public function scopeActive($q) { return $q->where('is_active', true); }
}
