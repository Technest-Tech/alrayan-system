<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\System\Setting;

class PublicPricingController extends Controller
{
    public function show()
    {
        if (!Setting::bool('pricing.public_site_visible', true)) {
            return response()->json(['visible' => false]);
        }
        $currency = Setting::get('pricing.public_site_currency', 'USD');
        // Prices stored in EGP minor; return as-is (FX conversion omitted for v1 public endpoint)
        return response()->json([
            'visible'              => true,
            'currency'             => $currency,
            'base_30'              => Setting::int('pricing.base_30'),
            'base_45'              => Setting::int('pricing.base_45'),
            'base_60'              => Setting::int('pricing.base_60'),
            'sibling_discount_pct' => Setting::int('pricing.sibling_default_discount_pct'),
        ]);
    }
}
