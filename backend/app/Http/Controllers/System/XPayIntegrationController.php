<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Services\Integrations\XPay\XPayClient;
use App\Support\System\Setting;
use Illuminate\Http\Request;

class XPayIntegrationController extends Controller
{
    public function show()
    {
        $this->authorize('view', 'settings');
        return response()->json([
            'enabled'           => Setting::bool('xpay.enabled', false),
            'community_id'      => Setting::get('xpay.community_id', ''),
            'variable_amount_id'=> Setting::get('xpay.variable_amount_id', ''),
            'redirect_url'      => Setting::get('xpay.redirect_url', ''),
            'webhook_url'       => url('/api/system/webhooks/xpay'),
        ]);
    }

    public function update(Request $request)
    {
        $this->authorize('edit', 'settings');
        $data = $request->validate([
            'enabled'            => 'sometimes|boolean',
            'api_key'            => 'sometimes|string',
            'community_id'       => 'sometimes|string',
            'variable_amount_id' => 'sometimes|string',
            'redirect_url'       => 'sometimes|url',
        ]);
        foreach ($data as $k => $v) {
            Setting::set("xpay.{$k}", $v);
        }
        return response()->json(['ok' => true]);
    }

    public function test()
    {
        $this->authorize('edit', 'settings');
        try {
            // A lightweight test: call prepare-amount with 100 piasters
            app(XPayClient::class)->prepareAmount(100, 'EGP');
            return response()->json(['ok' => true, 'message' => 'Connection successful']);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
