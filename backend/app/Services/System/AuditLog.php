<?php

namespace App\Services\System;

use App\Models\System\AuditLog as AuditLogModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLog
{
    public static function record(string $action, ?Model $target = null, array $payload = []): AuditLogModel
    {
        return AuditLogModel::create([
            'actor_user_id' => Auth::id(),
            'action'        => $action,
            'target_type'   => $target ? get_class($target) : null,
            'target_id'     => $target?->getKey(),
            'payload'       => $payload ?: null,
            'ip'            => Request::ip(),
            'user_agent'    => Request::userAgent(),
        ]);
    }
}
