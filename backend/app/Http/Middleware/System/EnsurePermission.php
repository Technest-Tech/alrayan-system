<?php

namespace App\Http\Middleware\System;

use App\Services\System\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role === 'admin') {
            return $next($request);
        }

        if (!$user->can($permission)) {
            AuditLog::record('auth.permission_denied', $user, [
                'permission' => $permission,
                'route'      => $request->path(),
            ]);
            return response()->json(['message' => 'Forbidden', 'permission' => $permission], 403);
        }

        return $next($request);
    }
}
