<?php

return [
    'version'          => '1.0.0',
    'frontend_url'     => env('SYSTEM_FRONTEND_URL', 'https://app.alrayan-academy.com'),
    'default_timezone' => env('SYSTEM_DEFAULT_TZ', 'Africa/Cairo'),
    'default_currency' => env('SYSTEM_DEFAULT_CURRENCY', 'USD'),
    'default_base_currency' => 'EGP',
    'features' => [
        'paymob'    => env('PAYMOB_ENABLED', false),
        'zoom'      => env('ZOOM_ENABLED', false),
        'wassender' => env('WASSENDER_ENABLED', false),
    ],
];
