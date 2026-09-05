<?php

return [
    'version'          => '1.0.0',
    'frontend_url'     => env('SYSTEM_FRONTEND_URL', 'https://app.alrayan-academy.com'),
    'default_timezone' => env('SYSTEM_DEFAULT_TZ', 'Africa/Cairo'),
    'default_currency' => env('SYSTEM_DEFAULT_CURRENCY', 'USD'),
    'default_base_currency' => 'EGP',
    /*
     * The first session a student actually receives is the free trial, so it must
     * never consume package hours. This is enforced in PackageService::rebuild
     * rather than relying on whoever records the lesson to pick the `trial`
     * status, because getting it wrong bills the student for a lesson the academy
     * advertises as free. Set SYSTEM_FIRST_SESSION_FREE=false to charge from the
     * very first lesson instead.
     */
    'first_session_free' => env('SYSTEM_FIRST_SESSION_FREE', true),

    'features' => [
        'paymob'    => env('PAYMOB_ENABLED', false),
        'zoom'      => env('ZOOM_ENABLED', false),
        'wassender' => env('WASSENDER_ENABLED', false),
    ],
];
