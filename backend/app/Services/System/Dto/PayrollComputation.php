<?php

namespace App\Services\System\Dto;

readonly class PayrollComputation
{
    public function __construct(
        public int   $totalSessions,
        public int   $totalMinutes,
        public array $breakdownByDuration,
        public int   $baseSalaryMinor,
        public array $rateSnapshot,
    ) {}
}
