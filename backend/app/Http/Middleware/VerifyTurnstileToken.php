<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class VerifyTurnstileToken
{
    public function handle(Request $request, Closure $next): mixed
    {
        $secret = config('services.turnstile.secret');
        $token = $request->input('turnstileToken');

        if (! $token) {
            return response()->json(['message' => 'Security check required.'], 422);
        }

        $response = Http::asForm()->post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            ['secret' => $secret, 'response' => $token, 'remoteip' => $request->ip()],
        );

        if (! $response->json('success', false)) {
            return response()->json(['message' => 'Security check failed. Please try again.'], 422);
        }

        return $next($request);
    }
}
