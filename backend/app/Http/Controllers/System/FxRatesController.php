<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FxRatesController extends Controller
{
    private array $pairs = [
        'USD_to_EGP', 'EUR_to_EGP', 'GBP_to_EGP',
        'CAD_to_EGP', 'SAR_to_EGP', 'AED_to_EGP',
    ];

    public function show(): JsonResponse
    {
        $rates = [];
        foreach ($this->pairs as $pair) {
            $rate    = Setting::get("pricing.fx.{$pair}");
            $updated = Setting::get("pricing.fx.{$pair}_updated_at");
            $stale   = $updated && Carbon::parse($updated)->diffInDays(now()) > 30;

            $rates[] = [
                'pair'       => $pair,
                'from'       => explode('_to_', $pair)[0],
                'to'         => explode('_to_', $pair)[1],
                'rate'       => $rate ? (float) $rate : null,
                'updated_at' => $updated,
                'is_stale'   => $stale,
            ];
        }

        return response()->json(['data' => $rates]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'rates'              => ['required', 'array'],
            'rates.*.pair'       => ['required', 'string'],
            'rates.*.rate'       => ['required', 'numeric', 'min:0'],
        ]);

        foreach ($data['rates'] as $item) {
            $pair = $item['pair'];
            Setting::set("pricing.fx.{$pair}", (string) $item['rate']);
            Setting::set("pricing.fx.{$pair}_updated_at", now()->toIso8601String());
        }

        return response()->json(['message' => 'FX rates updated.']);
    }
}
