<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Services\Integrations\Paymob\PaymobClient;
use App\Support\System\Setting;
use Illuminate\Http\Request;

class PaymobIntegrationController extends Controller
{
    public function show()
    {
        $this->authorize('view', 'settings');
        return response()->json([
            'enabled'          => Setting::bool('paymob.enabled', false),
            'integration_id'   => Setting::get('paymob.integration_id', ''),
            'public_iframe_id' => Setting::get('paymob.public_iframe_id', ''),
            'webhook_url'      => url('/api/system/webhooks/paymob'),
        ]);
    }

    public function update(Request $request)
    {
        $this->authorize('edit', 'settings');
        $data = $request->validate([
            'enabled'             => 'sometimes|boolean',
            'api_key'             => 'sometimes|string',
            'integration_id'      => 'sometimes|string',
            'public_iframe_id'    => 'sometimes|string',
            'webhook_hmac_secret' => 'sometimes|string',
        ]);
        foreach ($data as $k => $v) {
            Setting::set("paymob.{$k}", $v);
        }
        return response()->json(['ok' => true]);
    }

    public function test()
    {
        $this->authorize('edit', 'settings');
        try {
            app(PaymobClient::class)->authenticate();
            return response()->json(['ok' => true, 'message' => 'Connection successful']);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
