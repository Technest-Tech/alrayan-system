<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\WhatsAppGroup;
use App\Services\Integrations\Wassender\WassenderClient;
use App\Support\System\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WassenderIntegrationController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'api_key'    => Setting::get('wassender.api_key') ? '***' : '',
            'configured' => (bool) Setting::get('wassender.api_key'),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'api_key' => 'required|string|max:200',
        ]);

        Setting::set('wassender.api_key', $request->api_key);

        return response()->json(['message' => 'Wassender settings updated.']);
    }

    public function test(Request $request, WassenderClient $client): JsonResponse
    {
        $request->validate(['group_id' => 'required|exists:sys_whatsapp_groups,id']);
        $group  = WhatsAppGroup::findOrFail($request->group_id);
        $result = $client->testConnection($group);

        if ($result->success) {
            return response()->json(['message' => 'Test message sent successfully.', 'external_id' => $result->externalId]);
        }

        return response()->json(['message' => 'Test failed: ' . $result->errorBody], 422);
    }
}
