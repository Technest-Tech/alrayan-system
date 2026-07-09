<?php

return [

    /*
     * "browsershot" rasterises the Blade template with headless Chromium.
     * "fake" skips Chromium entirely and returns a canned public URL — used by
     * the test suite and by local environments without a Chromium binary.
     */
    'renderer' => env('REPORTS_RENDERER', 'browsershot'),

    /*
     * Acadmyq fetches report images server-side, so the URL we hand it must be
     * publicly resolvable over https. APP_URL is the right value in production;
     * it is overridable because the API is reachable on a different host than
     * the one artisan believes it is serving.
     */
    'public_base_url' => env('REPORTS_PUBLIC_BASE_URL', env('APP_URL')),

    'lesson_report' => [
        'disk'      => 'public',
        'directory' => 'system/lesson-reports',

        // Locale of the generated image, independent of the admin panel's UI locale:
        // the recipient is a student/guardian, not the logged-in staff member.
        'locale' => env('REPORTS_LOCALE', 'fr'),

        // Card width in CSS pixels. Doubling it via the scale factor keeps text
        // crisp when WhatsApp downsamples the attachment.
        'width'                => 760,
        'device_scale_factor'  => 2,
    ],

    'browsershot' => [
        'node_binary'      => env('BROWSERSHOT_NODE_BINARY'),
        'npm_binary'       => env('BROWSERSHOT_NPM_BINARY'),
        'chrome_path'      => env('BROWSERSHOT_CHROME_PATH'),
        'node_module_path' => env('BROWSERSHOT_NODE_MODULE_PATH'),

        'timeout' => (int) env('BROWSERSHOT_TIMEOUT', 60),

        // The droplet runs Chromium as a queue worker with a small /dev/shm and
        // no user namespace, which crashes the default sandbox.
        'no_sandbox'        => (bool) env('BROWSERSHOT_NO_SANDBOX', true),
        'chromium_arguments' => ['disable-dev-shm-usage'],
    ],
];
