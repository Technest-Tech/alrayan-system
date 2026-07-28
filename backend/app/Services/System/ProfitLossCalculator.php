<?php

namespace App\Services\System;

use App\Models\System\Expense;
use App\Models\System\Payroll;
use App\Services\System\Dto\ProfitLossStatement;
use App\Support\System\Currency\CurrencyConverter;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class ProfitLossCalculator
{
    public function __construct(private readonly RevenueAggregator $revenue) {}

    public function statement(Carbon $from, Carbon $to, string $baseCurrency = 'EGP'): ProfitLossStatement
    {
        $cacheKey = "pnl:statement:{$from->toDateString()}:{$to->toDateString()}:{$baseCurrency}";
        return Cache::remember($cacheKey, 300, function () use ($from, $to, $baseCurrency) {
            $revenueMinor  = $this->revenueInBase($from, $to, $baseCurrency);
            $salariesMinor = $this->salariesInBase($from, $to, $baseCurrency);
            $bonusesMinor  = $this->bonusesInBase($from, $to, $baseCurrency);
            $expensesMinor = $this->expensesInBase($from, $to, $baseCurrency);
            $totalCosts    = $salariesMinor + $bonusesMinor + $expensesMinor;

            return new ProfitLossStatement(
                from: $from,
                to: $to,
                baseCurrency: $baseCurrency,
                revenue: $revenueMinor,
                salaries: $salariesMinor,
                bonuses: $bonusesMinor,
                expenses: $expensesMinor,
                totalCosts: $totalCosts,
                netProfit: $revenueMinor - $totalCosts,
            );
        });
    }

    public function byMonth(Carbon $from, Carbon $to, string $baseCurrency = 'EGP'): Collection
    {
        $cacheKey = "pnl:by_month:{$from->toDateString()}:{$to->toDateString()}:{$baseCurrency}";
        return Cache::remember($cacheKey, 300, function () use ($from, $to, $baseCurrency) {
            $current = $from->copy()->startOfMonth();
            $rows    = collect();

            while ($current->lte($to)) {
                $monthEnd = $current->copy()->endOfMonth();
                $stmt     = $this->statement($current, $monthEnd, $baseCurrency);

                $rows->push([
                    'year'          => (int) $current->format('Y'),
                    'month'         => (int) $current->format('m'),
                    'month_label'   => $current->format('M Y'),
                    'revenue'       => $stmt->revenue,
                    'salaries'      => $stmt->salaries,
                    'bonuses'       => $stmt->bonuses,
                    'expenses'      => $stmt->expenses,
                    'total_costs'   => $stmt->totalCosts,
                    'net_profit'    => $stmt->netProfit,
                    'base_currency' => $baseCurrency,
                ]);

                $current->addMonth();
            }

            return $rows;
        });
    }

    private function revenueInBase(Carbon $from, Carbon $to, string $base): int
    {
        return $this->revenue->totalReceived($from, $to)->sum(function ($row) use ($base) {
            return $row->currency === $base
                ? (int) $row->total_minor
                : $this->safeConvert((int) $row->total_minor, $row->currency, $base);
        });
    }

    private function salariesInBase(Carbon $from, Carbon $to, string $base): int
    {
        $rows = Payroll::query()
            ->whereRaw('(period_year * 100 + period_month) BETWEEN ? AND ?', [
                ((int) $from->format('Y') * 100) + (int) $from->format('n'),
                ((int) $to->format('Y') * 100) + (int) $to->format('n'),
            ])
            ->whereIn('status', ['approved', 'transferred'])
            // Bonuses are reported separately below. Deductions reduce the
            // academy's salary cost, so base minus deductions + bonuses = net.
            ->selectRaw("COALESCE(currency, 'EGP') as currency, SUM(base_salary_minor - deductions_minor) as total")
            ->groupBy('currency')
            ->get();

        return $rows->sum(fn ($row) =>
            $row->currency === $base
                ? (int) $row->total
                : $this->safeConvert((int) $row->total, $row->currency, $base)
        );
    }

    private function bonusesInBase(Carbon $from, Carbon $to, string $base): int
    {
        $rows = Payroll::query()
            ->whereRaw('(period_year * 100 + period_month) BETWEEN ? AND ?', [
                ((int) $from->format('Y') * 100) + (int) $from->format('n'),
                ((int) $to->format('Y') * 100) + (int) $to->format('n'),
            ])
            ->whereIn('status', ['approved', 'transferred'])
            ->selectRaw("COALESCE(currency, 'EGP') as currency, SUM(bonuses_minor) as total")
            ->groupBy('currency')
            ->get();

        return $rows->sum(fn ($row) =>
            $row->currency === $base
                ? (int) $row->total
                : $this->safeConvert((int) $row->total, $row->currency, $base)
        );
    }

    private function expensesInBase(Carbon $from, Carbon $to, string $base): int
    {
        $total = Expense::whereBetween('occurred_on', [$from, $to])
            ->selectRaw('currency, SUM(amount_minor) as total')
            ->groupBy('currency')
            ->get();

        return $total->sum(fn($r) =>
            $r->currency === $base ? (int) $r->total : $this->safeConvert((int) $r->total, $r->currency, $base)
        );
    }

    private function safeConvert(int $minor, string $from, string $to): int
    {
        try {
            return CurrencyConverter::convert($minor, from: $from, to: $to);
        } catch (\RuntimeException) {
            return 0;
        }
    }
}
