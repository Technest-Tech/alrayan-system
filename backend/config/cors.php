<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        env('FRONTEND_URL'),                  // alrayan-academy.com
        env('FRONTEND_URL_STAGING'),          // staging.alrayan-academy.com
        env('SYSTEM_FRONTEND_URL'),           // app.alrayan-academy.com
        env('SYSTEM_FRONTEND_URL_STAGING'),   // app-staging.alrayan-academy.com
        'http://localhost:3000',
        'http://app.localhost:3000',
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
