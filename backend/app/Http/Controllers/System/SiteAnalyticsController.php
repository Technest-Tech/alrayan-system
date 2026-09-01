<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Services\Site\SiteTrafficStats;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteAnalyticsController extends Controller
{
    /** Longest window the dashboard will report on, in days. */
    private const MAX_RANGE_DAYS = 366;

    /** Traffic figures for the requested window (defaults to the last 30 days). */
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['sometimes', 'date'],
            'to'   => ['sometimes', 'date'],
        ]);

        $to   = isset($data['to']) ? CarbonImmutable::parse($data['to']) : CarbonImmutable::today();
        $from = isset($data['from']) ? CarbonImmutable::parse($data['from']) : $to->subDays(29);

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to, $from];
        }

        // Guard the chart and the database against an accidental decade-long range.
        if ($from->diffInDays($to) > self::MAX_RANGE_DAYS) {
            $from = $to->subDays(self::MAX_RANGE_DAYS);
        }

        return response()->json([
            'data' => SiteTrafficStats::between($from, $to)->all(),
        ]);
    }
}
