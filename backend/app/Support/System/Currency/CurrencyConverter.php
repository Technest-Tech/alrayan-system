<?php

namespace App\Support\System\Currency;

use App\Support\System\Setting;

class CurrencyConverter
{
    public static function convert(int $minor, string $from, string $to): int
    {
        if ($from === $to) return $minor;
        $rate = (float) Setting::get("pricing.fx.{$from}_to_{$to}", 0.0);
        if ($rate <= 0) {
            throw new \RuntimeException("FX rate not configured: {$from} → {$to}. Set in Settings → Pricing → FX rates.");
        }
        return (int) round($minor * $rate);
    }
}
