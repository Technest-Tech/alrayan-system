<?php

namespace App\Services\System;

use App\Models\System\Student;
use App\Support\System\Currency\CurrencyConverter;
use App\Support\System\Setting;

class PriceCalculator
{
    public function monthly(Student $s): int
    {
        if ($s->monthly_price_minor > 0) {
            return $this->applyDiscount($s, $s->monthly_price_minor);
        }
        $base   = $this->baseFor($s->session_duration_min, $s->currency);
        $scaled = (int) round($base * $s->sessions_per_month / 8);
        return $this->applyDiscount($s, $scaled);
    }

    private function applyDiscount(Student $s, int $price): int
    {
        $custom    = (int) $s->custom_discount_pct;
        $family    = FamilyDiscountResolver::highestFor($s);
        $effective = max($custom, $family);
        return (int) floor($price * (100 - $effective) / 100);
    }

    public function baseFor(int $duration, string $currency): int
    {
        $egpMinor = Setting::int("pricing.base_{$duration}");
        return CurrencyConverter::convert($egpMinor, from: 'EGP', to: $currency);
    }
}
