<?php

namespace App\Services\System\Dto;

use Carbon\Carbon;

class ProfitLossStatement
{
    public function __construct(
        public readonly Carbon $from,
        public readonly Carbon $to,
        public readonly string $baseCurrency,
        public readonly int    $revenue,
        public readonly int    $salaries,
        public readonly int    $bonuses,
        public readonly int    $expenses,
        public readonly int    $totalCosts,
        public readonly int    $netProfit,
    ) {}

    public function toArray(): array
    {
        return [
            'from'          => $this->from->toDateString(),
            'to'            => $this->to->toDateString(),
            'base_currency' => $this->baseCurrency,
            'revenue'       => $this->revenue,
            'salaries'      => $this->salaries,
            'bonuses'       => $this->bonuses,
            'expenses'      => $this->expenses,
            'total_costs'   => $this->totalCosts,
            'net_profit'    => $this->netProfit,
        ];
    }
}
