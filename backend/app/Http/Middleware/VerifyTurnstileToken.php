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

        // Captcha is optional. When no secret is configured we skip verification
        // entirely so the public forms keep working. Set TURNSTILE_SECRET_KEY
        // (and the frontend NEXT_PUBLIC_TURNSTILE_SITE_KEY) to turn on bot
        // protection — verification then applies automatically.
        if (! $secret) {
            return $next($request);
        }

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
