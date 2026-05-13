<?php

namespace Database\Factories\System;

use App\Models\System\MonthlyReport;
use Illuminate\Database\Eloquent\Factories\Factory;

class MonthlyReportFactory extends Factory
{
    protected $model = MonthlyReport::class;

    public function definition(): array
    {
        $year  = now()->year;
        $month = $this->faker->numberBetween(1, 12);

        return [
            'period_year'          => $year,
            'period_month'         => $month,
            'summary'              => ['period' => sprintf('%d-%02d', $year, $month), 'revenue' => [], 'pnl' => []],
            'pdf_path'             => null,
            'xlsx_path'            => null,
            'generated_at'         => now(),
            'generated_by_user_id' => null,
        ];
    }
}
