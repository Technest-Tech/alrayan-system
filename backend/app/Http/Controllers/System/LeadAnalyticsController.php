<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Lead;
use App\Services\System\ConversionAnalytics;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LeadAnalyticsController extends Controller
{
    public function __invoke(Request $request, ConversionAnalytics $analytics): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);

        $from = Carbon::parse($request->input('from', now()->subDays(30)->toDateString()))->startOfDay();
        $to   = Carbon::parse($request->input('to', now()->toDateString()))->endOfDay();

        $cacheKey = "lead_analytics:{$from->toDateString()}:{$to->toDateString()}";

        $rangeData = Cache::remember($cacheKey, 300, function () use ($analytics, $from, $to) {
            return [
                'funnel'        => $analytics->funnel($from, $to),
                'by_source'     => $analytics->bySource($from, $to),
                'by_supervisor' => $analytics->bySupervisor($from, $to),
                'trend_daily'   => $analytics->trendDaily($from, $to),
                'by_gender'     => $analytics->byGender($from, $to),
                'by_country'    => $analytics->byCountry($from, $to),
            ];
        });

        $snapshotData = Cache::remember('lead_analytics:snapshot', 120, function () use ($analytics) {
            return [
                'summary'         => $analytics->summary(),
                'by_status'       => $analytics->byStatus(),
                'recent_activity' => $analytics->recentActivity(),
            ];
        });

        return response()->json(array_merge($rangeData, $snapshotData));
    }
}
