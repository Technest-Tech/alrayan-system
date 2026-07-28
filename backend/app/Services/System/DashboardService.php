<?php

namespace App\Services\System;

use App\Models\System\Invoice;
use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use App\Models\System\AuditLog as AuditLogModel;
use App\Models\User;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * The admin dashboard payload.
 *
 * Everything here is counted off the tables the app actually writes to today:
 * lessons/hours from `sys_lessons` (via LessonMetrics), money from
 * `sys_student_packages` (a package is the unit that gets paid), people from
 * `users` / `sys_students` / `sys_teachers`. Money is never converted across
 * currencies — every amount is reported per currency.
 */
class DashboardService
{
    public function __construct(
        private readonly LessonMetrics       $lessons,
        private readonly ConversionAnalytics $conversions,
    ) {}

    public function summary(User $user): array
    {
        // Short TTL: the dashboard is the first thing people check after entering
        // data, so a long cache reads as "the numbers are wrong".
        return Cache::remember('dashboard:summary', 60, function () {
            $now            = Carbon::now();
            $monthStart     = $now->copy()->startOfMonth();
            $monthEnd       = $now->copy()->endOfMonth();
            $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
            $lastMonthEnd   = $now->copy()->subMonth()->endOfMonth();
            $todayStart     = $now->copy()->startOfDay();
            $todayEnd       = $now->copy()->endOfDay();

            $studentsByStatus = Student::selectRaw('status, COUNT(*) as c')
                ->groupBy('status')->pluck('c', 'status');
            $usersByRole = User::selectRaw('role, COUNT(*) as c')
                ->groupBy('role')->pluck('c', 'role');

            $activeNow       = (int) ($studentsByStatus['active'] ?? 0);
            $activeLastMonth = Student::where('status', 'active')
                ->whereDate('enrolled_at', '<=', $lastMonthEnd)->count();

            $conversionRate = 0;
            try {
                $conversionRate = $this->conversions->funnel($monthStart, $monthEnd)['conversion_rate'] ?? 0;
            } catch (\Throwable) {
                // Leads module unavailable — the rest of the dashboard still stands.
            }

            return [
                'base_currency' => Setting::get('reports.base_currency', config('system.default_base_currency', 'EGP')),
                'kpis' => [
                    // People
                    'total_users'           => (int) $usersByRole->sum(),
                    'total_students'        => (int) $studentsByStatus->sum(),
                    'total_teachers'        => Teacher::count(),
                    'active_teachers'       => Teacher::where('is_active', true)->count(),
                    'active_students'       => $activeNow,
                    'active_students_delta' => $activeNow - $activeLastMonth,
                    'trial_students'        => (int) ($studentsByStatus['trial'] ?? 0),
                    'paused_students'       => (int) ($studentsByStatus['paused'] ?? 0),
                    'suspended_students'    => (int) ($studentsByStatus['suspended'] ?? 0),

                    // Teaching activity
                    'lessons_today'         => Lesson::whereBetween('scheduled_at', [$todayStart, $todayEnd])->count(),
                    'lessons_month'         => Lesson::whereBetween('scheduled_at', [$monthStart, $monthEnd])->count(),
                    'hours_today'           => $this->lessons->totalHours($todayStart, $todayEnd),
                    'hours_month'           => $this->lessons->totalHours($monthStart, $now),
                    'hours_last_month'      => $this->lessons->totalHours($lastMonthStart, $lastMonthEnd),
                    'hours_total'           => $this->lessons->totalHours(),

                    // Money (per currency — never summed across currencies)
                    'month_revenue'         => $this->paidPackageValue($monthStart, $now),
                    'last_month_revenue'    => $this->paidPackageValue($lastMonthStart, $lastMonthEnd),
                    'outstanding'           => $this->pendingPackageValue(),
                    'conversion_rate'       => $conversionRate,
                ],
                'charts' => [
                    'hours_12m'          => $this->lessons->hoursByMonth(12),
                    'student_growth_12m' => $this->studentGrowthByMonth(12),
                    'revenue_12m'        => $this->revenueByMonth(12),
                    'lesson_status_30d'  => $this->lessonStatusBreakdown(30),
                ],
                'alerts'          => $this->buildAlerts(),
                'recent_activity' => $this->buildRecentActivity(),
            ];
        });
    }

    /**
     * Value of the packages paid inside the window, by currency. `tariff_at_time`
     * is the price snapshot of the whole package, in minor units.
     *
     * @return array<string,int>
     */
    private function paidPackageValue(Carbon $from, Carbon $to): array
    {
        return StudentPackage::where('status', 'paid')
            ->whereBetween('paid_at', [$from, $to])
            ->selectRaw('currency, COALESCE(SUM(tariff_at_time), 0) as total_minor')
            ->groupBy('currency')
            ->pluck('total_minor', 'currency')
            ->map(fn($v) => (int) $v)
            ->toArray();
    }

    /**
     * Value of everything sold but not yet paid, by currency.
     *
     * @return array<string,int>
     */
    private function pendingPackageValue(): array
    {
        return StudentPackage::where('status', 'pending')
            ->selectRaw('currency, COALESCE(SUM(tariff_at_time), 0) as total_minor')
            ->groupBy('currency')
            ->pluck('total_minor', 'currency')
            ->map(fn($v) => (int) $v)
            ->toArray();
    }

    /**
     * Paid-package value per month for the last N months, in the currency most
     * money is collected in (mixing currencies on one axis would be a lie).
     *
     * @return array<int, array{month:string, label:string, amount:int, currency:string}>
     */
    private function revenueByMonth(int $months): array
    {
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();
        $end   = Carbon::now()->endOfMonth();

        $primary = StudentPackage::where('status', 'paid')
            ->selectRaw('currency, COALESCE(SUM(tariff_at_time), 0) as total_minor')
            ->groupBy('currency')
            ->orderByDesc('total_minor')
            ->value('currency')
            ?? Setting::get('reports.base_currency', config('system.default_base_currency', 'EGP'));

        $rows = StudentPackage::where('status', 'paid')
            ->where('currency', $primary)
            ->whereBetween('paid_at', [$start, $end])
            ->selectRaw($this->lessons->monthExpr('paid_at') . ' as ym, COALESCE(SUM(tariff_at_time), 0) as total_minor')
            ->groupBy('ym')
            ->pluck('total_minor', 'ym');

        $out = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i)->startOfMonth();
            $out[] = [
                'month'    => $month->format('Y-m'),
                'label'    => $month->format('M Y'),
                'amount'   => (int) ($rows[$month->format('Y-m')] ?? 0),
                'currency' => $primary,
            ];
        }

        return $out;
    }

    /** @return array<int, array{month:string, label:string, active:int, new:int, cancelled:int}> */
    private function studentGrowthByMonth(int $months): array
    {
        $rows = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $start = Carbon::now()->subMonths($i)->startOfMonth();
            $end   = Carbon::now()->subMonths($i)->endOfMonth();
            $rows[] = [
                'month'     => $start->format('Y-m'),
                'label'     => $start->format('M Y'),
                'active'    => Student::where('status', 'active')->whereDate('enrolled_at', '<=', $end)->count(),
                'new'       => Student::whereBetween('enrolled_at', [$start, $end])->count(),
                'cancelled' => Student::where('status', 'cancelled')->whereBetween('cancelled_at', [$start, $end])->count(),
            ];
        }
        return $rows;
    }

    /** @return array<int, array{status:string, count:int}> */
    private function lessonStatusBreakdown(int $days): array
    {
        $counts = $this->lessons->statusCounts(null, Carbon::now()->subDays($days), Carbon::now());
        arsort($counts);

        return collect($counts)
            ->map(fn($count, $status) => ['status' => $status, 'count' => (int) $count])
            ->values()
            ->all();
    }

    private function buildAlerts(): array
    {
        $alerts = [];
        $now    = Carbon::now();

        // Lessons that were given but never written up.
        $missingReports = Lesson::whereIn('status', Lesson::TEACHER_PAID_STATUSES)
            ->where('scheduled_at', '<', $now)
            ->where('scheduled_at', '>=', $now->copy()->subDays(30))
            ->where(fn($q) => $q->whereNull('content')->orWhere('content', ''))
            ->count();
        if ($missingReports > 0) {
            $alerts[] = ['kind' => 'lesson.report_missing', 'count' => $missingReports, 'href' => '/calendar'];
        }

        // Packages the student is already consuming but hasn't paid for.
        $unpaidPackages = StudentPackage::where('status', 'pending')->count();
        if ($unpaidPackages > 0) {
            $alerts[] = ['kind' => 'package.unpaid', 'count' => $unpaidPackages, 'href' => '/payments'];
        }

        // Packages an admin flagged for re-confirmation after a schedule rebuild.
        $needsReconfirm = StudentPackage::where('needs_reconfirmation', true)->count();
        if ($needsReconfirm > 0) {
            $alerts[] = ['kind' => 'package.needs_reconfirmation', 'count' => $needsReconfirm, 'href' => '/payments'];
        }

        $overdueCount = Invoice::where('status', 'overdue')->count();
        if ($overdueCount > 0) {
            $alerts[] = ['kind' => 'invoice.overdue', 'count' => $overdueCount, 'href' => '/billing/invoices'];
        }

        $noWhatsapp = Student::where('status', 'active')->whereNull('whatsapp_group_id')->count();
        if ($noWhatsapp > 0) {
            $alerts[] = ['kind' => 'student.no_whatsapp', 'count' => $noWhatsapp, 'href' => '/whatsapp-groups'];
        }

        return $alerts;
    }

    private function buildRecentActivity(): array
    {
        return AuditLogModel::with('actor:id,name')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'actor_user_id', 'action', 'created_at'])
            ->map(fn($log) => [
                'text' => trim(($log->actor->name ?? 'System') . ' ' . str_replace('_', ' ', $log->action)),
                'at'   => $log->created_at->toISOString(),
            ])
            ->toArray();
    }
}
