<?php

namespace App\Services\System;

use Carbon\Carbon;

class ProRataResult
{
    public function __construct(
        public readonly int $monthlyPriceMinor,
        public readonly int $daysInMonth,
        public readonly int $remainingDays,
        public readonly int $amountMinor,
    ) {}
}

class ProRataCalculator
{
    public function forCurrentMonth(int $monthlyPriceMinor, ?Carbon $reference = null, ?Carbon $startFrom = null): ProRataResult
    {
        $ref        = ($reference ?? now())->copy()->startOfDay();
        $start      = ($startFrom ?? $ref)->copy()->startOfDay();
        $endOfMonth = $ref->copy()->endOfMonth()->startOfDay();
        $daysInMo   = (int) $ref->daysInMonth;
        $remaining  = (int) $start->diffInDays($endOfMonth) + 1;
        $remaining  = max(0, min($daysInMo, $remaining));
        $amount     = (int) floor($monthlyPriceMinor * $remaining / $daysInMo);
        return new ProRataResult(
            monthlyPriceMinor: $monthlyPriceMinor,
            daysInMonth:       $daysInMo,
            remainingDays:     $remaining,
            amountMinor:       $amount,
        );
    }
}
