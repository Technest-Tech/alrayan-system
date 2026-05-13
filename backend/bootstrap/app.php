<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            \Illuminate\Support\Facades\Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/system.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Handle CORS for all requests
        $middleware->append(HandleCors::class);

        // Named rate limiters (configured in AppServiceProvider)
        $middleware->throttleApi();

        // Middleware aliases
        $middleware->alias([
            'turnstile'    => \App\Http\Middleware\VerifyTurnstileToken::class,
            'system.active'=> \App\Http\Middleware\System\EnsureSystemActive::class,
            'system.can'   => \App\Http\Middleware\System\EnsurePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
