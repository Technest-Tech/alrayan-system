<?php

namespace App\Http\Middleware\System;

use Closure;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Makes a "create" request safe to send twice.
 *
 * A form sends one `Idempotency-Key` per record it means to create. A repeat of that key — a
 * double submit, or a retry after a timeout whose first attempt had in fact saved — gets the
 * first response back instead of creating a second copy. Creating a student is where this
 * bit: every copy gets its own synthesized email (the real one is taken by the first), so the
 * duplicate shows up as the same person with a strange address.
 *
 * Only successful responses are remembered: a validation error must stay fixable and
 * resubmittable under the same key. Requests without the header pass straight through.
 */
class PreventDuplicateSubmission
{
    private const REMEMBER_SECONDS = 3600;

    /** Upper bound on how long one create may hold the key before the lock lapses. */
    private const LOCK_SECONDS = 120;

    /** How long a repeat waits for the first attempt to finish before giving up. */
    private const WAIT_SECONDS = 30;

    public function handle(Request $request, Closure $next): Response
    {
        $key  = trim((string) $request->header('Idempotency-Key'));
        $user = $request->user();

        if ($key === '' || strlen($key) > 4096 || ! $user) {
            return $next($request);
        }

        $cacheKey = 'idempotency:' . sha1(implode('|', [
            $user->getAuthIdentifier(), $request->method(), $request->path(), $key,
        ]));

        $lock = Cache::lock("{$cacheKey}:lock", self::LOCK_SECONDS);

        try {
            $lock->block(self::WAIT_SECONDS);
        } catch (LockTimeoutException) {
            return response()->json(['message' => 'This request is already being processed.'], 409);
        }

        try {
            if ($first = Cache::get($cacheKey)) {
                return response($first['body'], $first['status'], [
                    'Content-Type'        => 'application/json',
                    'Idempotent-Replayed' => 'true',
                ]);
            }

            $response = $next($request);

            if ($response->isSuccessful()) {
                Cache::put($cacheKey, [
                    'status' => $response->getStatusCode(),
                    'body'   => $response->getContent(),
                ], self::REMEMBER_SECONDS);
            }

            return $response;
        } finally {
            $lock->release();
        }
    }
}
