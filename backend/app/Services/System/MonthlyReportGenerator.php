<?php

namespace App\Services\System;

use App\Models\System\MonthlyReport;
use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Models\System\TeacherLeave;
use App\Models\User;
use App\Support\System\Setting;
use Carbon\Carbon;

class MonthlyReportGenerator
{
    public function __construct(
        private readonly RevenueAggregator      $revenue,
        private readonly ProfitLossCalculator   $pnl,
        private readonly CollectionReportBuilder $collection,
        private readonly CancellationReportBuilder $cancellations,
        private readonly TrialAnalyticsBuilder  $trials,
    ) {}

    public function generate(int $year, int $month, ?User $by = null): MonthlyReport
    {
        $existing = MonthlyReport::where('period_year', $year)->where('period_month', $month)->first();
        if ($existing && !$by) {
            return $existing;
        }

        $from = Carbon::create($year, $month, 1)->startOfMonth();
        $to   = $from->copy()->endOfMonth();

        $base = Setting::get('reports.base_currency', 'EGP');

        $summary = [
            'period'        => sprintf('%d-%02d', $year, $month),
            'base_currency' => $base,
            'revenue'       => $this->revenue->totalReceived($from, $to)->toArray(),
            'pnl'           => $this->pnl->statement($from, $to, $base)->toArray(),
            'collection'    => $this->collection->build($from, $to)->toArray(),
            'cancellations' => $this->cancellations->build($from, $to)->toArray(),
            'trials'        => $this->trials->build($from, $to)->toArray(),
            'student_growth' => [
                'start_active' => Student::where('status', 'active')->whereDate('enrolled_at', '<=', $from)->count(),
                'end_active'   => Student::where('status', 'active')->whereDate('enrolled_at', '<=', $to)->count(),
                'new'          => Student::whereBetween('enrolled_at', [$from, $to])->count(),
                'cancelled'    => Student::where('status', 'cancelled')->whereBetween('cancelled_at', [$from, $to])->count(),
            ],
            'teacher_stats' => [
                'active' => Teacher::where('is_active', true)->count(),
                'leaves' => TeacherLeave::where('status', 'approved')->whereBetween('starts_on', [$from, $to])->count(),
            ],
            'generated_at'   => now()->toIso8601String(),
            'generated_by'   => $by?->name ?? 'system cron',
        ];

        return MonthlyReport::updateOrCreate(
            ['period_year' => $year, 'period_month' => $month],
            [
                'summary'              => $summary,
                'pdf_path'             => null,
                'xlsx_path'            => null,
                'generated_at'         => now(),
                'generated_by_user_id' => $by?->id,
            ]
        );
    }
}
