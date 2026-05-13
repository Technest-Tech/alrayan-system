<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Support\System\Setting;
use Illuminate\Http\Request;

class PricingSettingsController extends Controller
{
    public function show()
    {
        $this->authorize('view', 'settings');
        return response()->json([
            'base_30'                      => Setting::int('pricing.base_30'),
            'base_45'                      => Setting::int('pricing.base_45'),
            'base_60'                      => Setting::int('pricing.base_60'),
            'sibling_default_discount_pct' => Setting::int('pricing.sibling_default_discount_pct'),
            'supported_currencies'         => json_decode(Setting::get('pricing.supported_currencies', '["USD"]'), true),
            'public_site_currency'         => Setting::get('pricing.public_site_currency', 'USD'),
            'public_site_visible'          => Setting::bool('pricing.public_site_visible', true),
            'invoice_prefix'               => Setting::get('invoice.prefix', 'INV'),
            'invoice_due_days'             => Setting::int('invoice.due_days', 3),
            'invoice_suspend_after_months' => Setting::int('invoice.suspend_after_months', 2),
            'invoice_send_on_create'       => Setting::bool('invoice.send_on_create', true),
        ]);
    }

    public function update(Request $request)
    {
        $this->authorize('edit', 'settings');
        $data = $request->validate([
            'base_30'                      => 'sometimes|integer|min:0',
            'base_45'                      => 'sometimes|integer|min:0',
            'base_60'                      => 'sometimes|integer|min:0',
            'sibling_default_discount_pct' => 'sometimes|integer|min:0|max:100',
            'supported_currencies'         => 'sometimes|array',
            'public_site_currency'         => 'sometimes|string|size:3',
            'public_site_visible'          => 'sometimes|boolean',
            'invoice_prefix'               => 'sometimes|string|max:10',
            'invoice_due_days'             => 'sometimes|integer|min:1|max:90',
            'invoice_suspend_after_months' => 'sometimes|integer|min:1|max:24',
            'invoice_send_on_create'       => 'sometimes|boolean',
        ]);
        $map = [
            'base_30'                      => 'pricing.base_30',
            'base_45'                      => 'pricing.base_45',
            'base_60'                      => 'pricing.base_60',
            'sibling_default_discount_pct' => 'pricing.sibling_default_discount_pct',
            'supported_currencies'         => 'pricing.supported_currencies',
            'public_site_currency'         => 'pricing.public_site_currency',
            'public_site_visible'          => 'pricing.public_site_visible',
            'invoice_prefix'               => 'invoice.prefix',
            'invoice_due_days'             => 'invoice.due_days',
            'invoice_suspend_after_months' => 'invoice.suspend_after_months',
            'invoice_send_on_create'       => 'invoice.send_on_create',
        ];
        foreach ($data as $k => $v) {
            Setting::set($map[$k], is_array($v) ? json_encode($v) : $v);
        }
        return response()->json(['ok' => true]);
    }
}
