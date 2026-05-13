<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MonthlyReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $summary = $this->summary ?? [];

        return [
            'id'           => $this->id,
            'period_year'  => $this->period_year,
            'period_month' => $this->period_month,
            'label'        => $this->label(),
            'summary'      => [
                'revenue_by_currency' => $summary['revenue'] ?? [],
                'net_profit'          => $summary['pnl']['net_profit'] ?? null,
                'base_currency'       => $summary['base_currency'] ?? 'EGP',
            ],
            'pdf_path'     => $this->pdf_path,
            'xlsx_path'    => $this->xlsx_path,
            'generated_at' => $this->generated_at?->toIso8601String(),
            'generated_by' => $this->generatedBy?->name ?? 'System cron',
        ];
    }
}
