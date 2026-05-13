<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'status'  => 'ok',
            'version' => config('system.version', '1.0.0'),
            'time'    => now()->toIso8601String(),
        ]);
    }
}
