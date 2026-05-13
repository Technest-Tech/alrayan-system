<?php

namespace App\Services\System;

use App\Models\System\Invoice;
use App\Services\System\Dto\CollectionReport;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class CollectionReportBuilder
{
    public function build(Carbon $from, Carbon $to): CollectionReport
    {
        $cacheKey = "collection:{$from->toDateString()}:{$to->toDateString()}";
        return Cache::remember($cacheKey, 300, function () use ($from, $to) {
            $issued = Invoice::whereBetween('issued_at', [$from, $to])
                ->where('type', 'monthly')
                ->with('payments')
                ->get();

            $onTime = $issued->filter(fn($i) =>
                $i->status === 'paid' && $i->paid_at !== null && $i->paid_at->lte($i->due_at)
            )->count();

            $late = $issued->filter(fn($i) =>
                $i->status === 'paid' && $i->paid_at !== null && $i->paid_at->gt($i->due_at)
            )->count();

            $unpaid = $issued->whereIn('status', ['sent', 'overdue'])->count();

            $paidInvoices = $issued->where('status', 'paid')->filter(fn($i) => $i->paid_at !== null);
            $avgDaysDelay = $paidInvoices->isNotEmpty()
                ? $paidInvoices->map(fn($i) => max(0, $i->due_at->diffInDays($i->paid_at)))->avg()
                : 0.0;

            $total = $issued->count();
            $collectionRate = $total === 0 ? 100 : (int) round(100 * ($onTime + $late) / $total);

            return new CollectionReport(
                totalIssued: $total,
                paidOnTime: $onTime,
                paidLate: $late,
                unpaid: $unpaid,
                collectionRate: $collectionRate,
                averageDaysDelay: (float) $avgDaysDelay,
                outstandingMinorByCurrency: $this->outstandingByCurrency(),
            );
        });
    }

    public function trend(int $months = 6): array
    {
        $rows = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $start = now()->subMonths($i)->startOfMonth();
            $end   = now()->subMonths($i)->endOfMonth();
            $report = $this->build($start, $end);
            $rows[] = [
                'month'           => $start->format('M Y'),
                'collection_rate' => $report->collectionRate,
                'avg_days_delay'  => $report->averageDaysDelay,
            ];
        }
        return $rows;
    }

    private function outstandingByCurrency(): array
    {
        return Invoice::whereIn('status', ['sent', 'overdue'])
            ->selectRaw('currency, SUM(total_minor) as total')
            ->groupBy('currency')
            ->pluck('total', 'currency')
            ->map(fn($v) => (int) $v)
            ->toArray();
    }
}
