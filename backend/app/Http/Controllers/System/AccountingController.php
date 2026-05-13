<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Services\System\CancellationReportBuilder;
use App\Services\System\CollectionReportBuilder;
use App\Services\System\ProfitLossCalculator;
use App\Services\System\RevenueAggregator;
use App\Services\System\TrialAnalyticsBuilder;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountingController extends Controller
{
    public function __construct(
        private readonly RevenueAggregator     $revenue,
        private readonly ProfitLossCalculator  $pnl,
        private readonly CollectionReportBuilder $collection,
        private readonly CancellationReportBuilder $cancellations,
        private readonly TrialAnalyticsBuilder $trials,
    ) {}

    public function revenue(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request, 12);
        $base = Setting::get('reports.base_currency', 'EGP');

        return response()->json([
            'from'          => $from->toDateString(),
            'to'            => $to->toDateString(),
            'base_currency' => $base,
            'totals'        => $this->revenue->totalReceived($from, $to),
            'by_course'     => $this->revenue->byCourse($from, $to),
            'by_month'      => $this->revenue->byMonth($from, $to, $base),
        ]);
    }

    public function profitLoss(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request, 12);
        $base = $request->input('base', Setting::get('reports.base_currency', 'EGP'));

        $monthly = $this->pnl->byMonth($from, $to, $base);
        $stmt    = $this->pnl->statement($from, $to, $base);

        return response()->json([
            'from'          => $from->toDateString(),
            'to'            => $to->toDateString(),
            'base_currency' => $base,
            'monthly'       => $monthly,
            'totals'        => $stmt->toArray(),
            'note'          => 'Cross-currency values use today\'s FX rate, not transaction-day rate.',
        ]);
    }

    public function collection(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request, 6);
        $report = $this->collection->build($from, $to);
        $trend  = $this->collection->trend(6);

        return response()->json(array_merge($report->toArray(), ['trend' => $trend]));
    }

    public function cancellations(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request, 6);
        $report = $this->cancellations->build($from, $to);
        return response()->json($report->toArray());
    }

    public function trials(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request, 3);
        $report = $this->trials->build($from, $to);
        return response()->json($report->toArray());
    }

    private function range(Request $request, int $defaultMonths): array
    {
        $from = $request->input('from')
            ? Carbon::parse($request->input('from'))->startOfDay()
            : now()->subMonths($defaultMonths)->startOfMonth();

        $to = $request->input('to')
            ? Carbon::parse($request->input('to'))->endOfDay()
            : now()->endOfMonth();

        return [$from, $to];
    }
}
