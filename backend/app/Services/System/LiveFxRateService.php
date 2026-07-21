<?php

namespace App\Services\System;

use App\Support\System\Currency\SupportedCurrencies;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Live foreign-exchange rates → EGP for the Analytics page.
 *
 * Primary source is a free, key-less rates API (fawazahmed0/currency-api via
 * jsDelivr, with a mirror fallback). If the network is unreachable we fall back
 * to the manually-maintained `pricing.fx.*_to_EGP` settings, and finally mark a
 * currency unavailable. The whole payload is cached so we hit the network at
 * most once an hour (5 min when we could only serve manual/partial data).
 */
class LiveFxRateService
{
    private const CACHE_KEY = 'fx:to_egp:v1';

    /** Base-EGP endpoints — each returns {"date":..,"egp":{"usd":0.02,..}} (1 EGP = N units). */
    private array $endpoints = [
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/egp.min.json',
        'https://latest.currency-api.pages.dev/v1/currencies/egp.min.json',
    ];

    /**
     * @return array{base:string, source:string, fetched_at:?string, rates:array<int,array{currency:string,to_egp:?float,source:string}>}
     */
    public function toEgp(): array
    {
        if ($cached = Cache::get(self::CACHE_KEY)) {
            return $cached;
        }

        $currencies = array_values(array_diff(SupportedCurrencies::all(), ['EGP']));
        [$liveMap, $fetchedAt] = $this->fetchLive();

        $rows      = [];
        $anyLive   = false;
        $anyManual = false;

        foreach ($currencies as $ccy) {
            $to  = $liveMap[$ccy] ?? null;
            $src = 'live';

            if ($to === null) {
                $manual = Setting::get("pricing.fx.{$ccy}_to_EGP");
                if ($manual !== null && (float) $manual > 0) {
                    $to  = round((float) $manual, 4);
                    $src = 'manual';
                    $anyManual = true;
                } else {
                    $src = 'unavailable';
                }
            } else {
                $anyLive = true;
            }

            $rows[] = ['currency' => $ccy, 'to_egp' => $to, 'source' => $src];
        }

        $source = $anyLive ? ($anyManual ? 'mixed' : 'live') : ($anyManual ? 'manual' : 'unavailable');

        $payload = [
            'base'       => 'EGP',
            'source'     => $source,
            'fetched_at' => $anyLive ? $fetchedAt : Carbon::now()->toISOString(),
            'rates'      => $rows,
        ];

        // Cache real live data for an hour; degraded data only briefly so we retry soon.
        Cache::put(self::CACHE_KEY, $payload, $anyLive ? 3600 : 300);

        return $payload;
    }

    /** Force a re-fetch on the next read. */
    public function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * @return array{0: array<string,float>, 1: ?string} [ CCY => rate-to-EGP, fetched date ]
     */
    private function fetchLive(): array
    {
        foreach ($this->endpoints as $url) {
            try {
                $res = Http::timeout(6)->acceptJson()->get($url);
                if (! $res->ok()) continue;

                $body = $res->json();
                $egp  = $body['egp'] ?? null;      // 1 EGP = $egp[ccy] units of ccy
                if (! is_array($egp)) continue;

                $map = [];
                foreach ($egp as $ccy => $perEgp) {
                    if (is_numeric($perEgp) && (float) $perEgp > 0) {
                        $map[strtoupper($ccy)] = round(1 / (float) $perEgp, 4); // ccy → EGP
                    }
                }
                if ($map) {
                    $date = isset($body['date']) ? Carbon::parse($body['date'])->toISOString() : Carbon::now()->toISOString();
                    return [$map, $date];
                }
            } catch (\Throwable $e) {
                Log::warning('LiveFxRateService fetch failed', ['url' => $url, 'error' => $e->getMessage()]);
            }
        }

        return [[], null];
    }
}
