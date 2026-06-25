<?php

namespace App\Services\System;

use App\Models\System\Invoice;
use App\Models\System\Session;
use App\Models\System\Student;
use App\Models\System\AuditLog as AuditLogModel;
use App\Models\User;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class DashboardService
{
    public function __construct(
        private readonly RevenueAggregator       $revenue,
        private readonly ProfitLossCalculator    $pnl,
        private readonly CollectionReportBuilder $collection,
        private readonly CancellationReportBuilder $cancellations,
        private readonly ConversionAnalytics     $conversions,
        private readonly RevenueAggregator       $revAgg,
    ) {}

    public function summary(User $user): array
    {
        $cacheKey = "dashboard:{$user->id}";
        return Cache::remember($cacheKey, 300, function () use ($user) {
            $tz       = Setting::get('academy.default_timezone', 'Africa/Cairo');
            $now      = now()->setTimezone($tz);
            $monthStart = $now->copy()->startOfMonth();
            $monthEnd   = $now->copy()->endOfMonth();
            $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
            $lastMonthEnd   = $now->copy()->subMonth()->endOfMonth();

            $activeNow      = Student::where('status', 'active')->count();
            $activeLastMonth = Student::where('status', 'active')
                ->whereDate('enrolled_at', '<=', $lastMonthEnd)->count();

            $monthRevenue = $this->revenue->totalReceived($monthStart, $monthEnd);
            $monthPnl     = $this->pnl->statement($monthStart, $monthEnd, Setting::get('reports.base_currency', 'EGP'));
            $collection30  = $this->collection->build($monthStart, $monthEnd);

            $conversionRate = 0;
            try {
                $funnel = $this->conversions->funnel($monthStart, $monthEnd);
                $conversionRate = $funnel['conversion_rate'] ?? 0;
            } catch (\Throwable) {}

            return [
                'kpis' => [
                    'active_students'       => $activeNow,
                    'active_students_delta' => $activeNow - $activeLastMonth,
                    'trial_students'        => Student::where('status', 'trial')->count(),
                    'paused_students'       => Student::where('status', 'paused')->count(),
                    'suspended_students'    => Student::where('status', 'suspended')->count(),
                    'today_sessions'        => Session::whereDate('scheduled_start', $now->toDateString())->count(),
                    'month_revenue'         => $monthRevenue->pluck('total_minor', 'currency'),
                    'month_net_profit_base' => $monthPnl->netProfit,
                    'outstanding'           => $collection30->outstandingMinorByCurrency,
                    'collection_rate'       => $collection30->collectionRate,
                    'conversion_rate'       => $conversionRate,
                ],
                'charts' => [
                    'revenue_12m'           => $this->revenue->byMonth(now()->subMonths(11)->startOfMonth(), now()->endOfMonth()),
                    'student_growth_12m'    => $this->studentGrowthByMonth(12),
                    'expenses_breakdown_30d'=> $this->expensesByCategory(30),
                    'cancellation_reasons'  => $this->cancellationReasons(90),
                ],
                'alerts'          => $this->buildAlerts(),
                'recent_activity' => $this->buildRecentActivity(),
            ];
        });
    }

    private function studentGrowthByMonth(int $months): array
    {
        $rows = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $start = now()->subMonths($i)->startOfMonth();
            $end   = now()->subMonths($i)->endOfMonth();
            $rows[] = [
                'month'     => $start->format('M Y'),
                'active'    => Student::where('status', 'active')->whereDate('enrolled_at', '<=', $end)->count(),
                'new'       => Student::whereBetween('enrolled_at', [$start, $end])->count(),
                'cancelled' => Student::where('status', 'cancelled')->whereBetween('cancelled_at', [$start, $end])->count(),
            ];
        }
        return $rows;
    }

    private function expensesByCategory(int $days): array
    {
        return \App\Models\System\Expense::join('sys_expense_categories', 'sys_expenses.category_id', '=', 'sys_expense_categories.id')
            ->where('sys_expenses.occurred_on', '>=', now()->subDays($days)->toDateString())
            ->selectRaw('sys_expense_categories.name as category, SUM(sys_expenses.amount_minor) as amount')
            ->groupBy('sys_expense_categories.name')
            ->get()
            ->map(fn($r) => ['category' => $r->category, 'amount' => (int) $r->amount])
            ->values()
            ->toArray();
    }

    private function cancellationReasons(int $days): array
    {
        return Student::where('status', 'cancelled')
            ->where('cancelled_at', '>=', now()->subDays($days))
            ->selectRaw('cancellation_reason as reason, COUNT(*) as count')
            ->groupBy('cancellation_reason')
            ->get()
            ->map(fn($r) => ['reason' => $r->reason ?? 'Unknown', 'count' => (int) $r->count])
            ->values()
            ->toArray();
    }

    private function buildAlerts(): array
    {
        $alerts = [];

        $overdueCount = Invoice::where('status', 'overdue')->count();
        if ($overdueCount > 0) {
            $alerts[] = ['kind' => 'invoice.overdue', 'count' => $overdueCount, 'href' => '/billing/overdue'];
        }

        $missingReports = Session::whereDate('scheduled_start', '<', now())
            ->whereDoesntHave('report')
            ->count();
        if ($missingReports > 0) {
            $alerts[] = ['kind' => 'report.missing', 'count' => $missingReports, 'href' => '/session-reports'];
        }

        $noWhatsapp = Student::where('status', 'active')
            ->whereNull('whatsapp_group_id')
            ->count();
        if ($noWhatsapp > 0) {
            $alerts[] = ['kind' => 'student.no_whatsapp', 'count' => $noWhatsapp, 'href' => '/whatsapp-groups'];
        }

        return $alerts;
    }

    private function buildRecentActivity(): array
    {
        return AuditLogModel::orderByDesc('created_at')
            ->limit(10)
            ->get(['action', 'actor_name', 'created_at'])
            ->map(fn($log) => [
                'text' => trim(($log->actor_name ?? 'System') . ' ' . str_replace('_', ' ', $log->action)),
                'at'   => $log->created_at->toISOString(),
            ])
            ->toArray();
    }
}
