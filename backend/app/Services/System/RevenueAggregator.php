<?php

namespace App\Services\System;

use App\Models\System\Payment;
use App\Support\System\Currency\CurrencyConverter;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class RevenueAggregator
{
    public function totalReceived(Carbon $from, Carbon $to): Collection
    {
        $cacheKey = "revenue:total:{$from->toDateString()}:{$to->toDateString()}";
        return Cache::remember($cacheKey, 300, fn() =>
            Payment::whereBetween('paid_at', [$from, $to])
                ->selectRaw('currency, SUM(amount_minor) as total_minor, COUNT(*) as payment_count')
                ->groupBy('currency')
                ->get()
        );
    }

    public function byCourse(Carbon $from, Carbon $to): Collection
    {
        $cacheKey = "revenue:by_course:{$from->toDateString()}:{$to->toDateString()}";
        return Cache::remember($cacheKey, 300, fn() =>
            Payment::query()
                ->join('sys_invoices', 'sys_payments.invoice_id', '=', 'sys_invoices.id')
                ->join('sys_students', 'sys_invoices.student_id', '=', 'sys_students.id')
                ->join('courses', 'sys_students.course_id', '=', 'courses.id')
                ->whereBetween('sys_payments.paid_at', [$from, $to])
                ->selectRaw('courses.id as course_id, courses.title as course_name, sys_payments.currency, SUM(sys_payments.amount_minor) as total_minor, COUNT(*) as payment_count')
                ->groupBy('courses.id', 'courses.title', 'sys_payments.currency')
                ->get()
        );
    }

    public function byMonth(Carbon $from, Carbon $to, string $baseCurrency = 'EGP'): Collection
    {
        $cacheKey = "revenue:by_month:{$from->toDateString()}:{$to->toDateString()}:{$baseCurrency}";
        return Cache::remember($cacheKey, 300, function () use ($from, $to, $baseCurrency) {
            $isSqlite = config('database.default') === 'sqlite';
            $yearExpr  = $isSqlite ? "CAST(strftime('%Y', paid_at) AS INTEGER)" : 'YEAR(paid_at)';
            $monthExpr = $isSqlite ? "CAST(strftime('%m', paid_at) AS INTEGER)" : 'MONTH(paid_at)';

            $rows = Payment::whereBetween('paid_at', [$from, $to])
                ->selectRaw("{$yearExpr} as year, {$monthExpr} as month, currency, SUM(amount_minor) as total_minor")
                ->groupBy('year', 'month', 'currency')
                ->orderBy('year')->orderBy('month')
                ->get();

            return $rows->map(function ($row) use ($baseCurrency) {
                $convertedMinor = $row->currency === $baseCurrency
                    ? $row->total_minor
                    : $this->safeConvert((int) $row->total_minor, $row->currency, $baseCurrency);

                return [
                    'year'           => $row->year,
                    'month'          => $row->month,
                    'currency'       => $row->currency,
                    'total_minor'    => $row->total_minor,
                    'base_minor'     => $convertedMinor,
                    'base_currency'  => $baseCurrency,
                ];
            });
        });
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
