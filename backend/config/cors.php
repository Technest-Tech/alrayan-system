<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_merge(
        // Explicit per-env vars (legacy / staging slots)
        [
            env('FRONTEND_URL'),
            env('FRONTEND_URL_STAGING'),
            env('SYSTEM_FRONTEND_URL'),
            env('SYSTEM_FRONTEND_URL_STAGING'),
            'http://localhost:3000',
            'http://app.localhost:3000',
        ],
        // Comma-separated list (preferred for prod) — CORS_ALLOWED_ORIGINS=...
        array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
