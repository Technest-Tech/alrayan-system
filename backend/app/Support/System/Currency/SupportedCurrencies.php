<?php

namespace App\Support\System\Currency;

use App\Support\System\Setting;

class SupportedCurrencies
{
    public static function all(): array
    {
        $raw = Setting::get('pricing.supported_currencies', '["USD","EUR","EGP"]');
        return json_decode($raw, true) ?? [];
    }
}
