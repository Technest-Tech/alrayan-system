<?php

return [
    'enabled'  => env('WHATSAPP_ENABLED', false),

    'base_url' => rtrim(env('WHATSAPP_API_BASE_URL', 'https://api.acadmyq.com'), '/'),

    'api_key'  => env('WHATSAPP_API_KEY', ''),

    'timeout'  => (int) env('WHATSAPP_TIMEOUT', 15),
];
