<?php

namespace App\Services\System;

use App\Events\System\PayrollGenerated;
use App\Models\System\Payroll;
use App\Models\System\PayrollAdjustment;
use App\Models\System\Session;
use App\Models\System\SessionReport;
use App\Models\System\Teacher;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PayrollGenerator
{
    public function __construct(private PayrollCalculator $calculator) {}

    public function generate(Teacher $teacher, int $year, int $month, Carbon $start, Carbon $end): Payroll
    {
        $existing = Payroll::withTrashed()
            ->where('teacher_id', $teacher->id)
            ->where('period_year', $year)
            ->where('period_month', $month)
            ->first();

        if ($existing && !$existing->trashed()) return $existing;

        return DB::transaction(function () use ($teacher, $year, $month, $start, $end) {
            $comp = $this->calculator->calculate($teacher, $start, $end);

            $payroll = Payroll::create([
                'teacher_id'             => $teacher->id,
                'period_year'            => $year,
                'period_month'           => $month,
                'total_sessions'         => $comp->totalSessions,
                'total_minutes'          => $comp->totalMinutes,
                'breakdown_by_duration'  => $comp->breakdownByDuration,
                'base_salary_minor'      => $comp->baseSalaryMinor,
                'bonuses_minor'          => 0,
                'deductions_minor'       => 0,
                'net_salary_minor'       => $comp->baseSalaryMinor,
                'status'                 => 'pending',
                'snapshot'               => $comp->rateSnapshot,
            ]);

            $this->autoAddLateReportDeduction($payroll, $teacher, $start, $end);
            $payroll->recomputeTotals();

            event(new PayrollGenerated($payroll));
            return $payroll;
        });
    }

    public function regenerate(Payroll $payroll): Payroll
    {
        if ($payroll->status !== 'pending') {
            abort(422, 'Only pending payrolls can be recalculated.');
        }

        $start = Carbon::create($payroll->period_year, $payroll->period_month, 1)->startOfMonth()->utc();
        $end   = $start->copy()->endOfMonth()->addDay()->startOfDay();

        $comp = $this->calculator->calculate($payroll->teacher, $start, $end, $payroll->snapshot);

        $payroll->update([
            'total_sessions'        => $comp->totalSessions,
            'total_minutes'         => $comp->totalMinutes,
            'breakdown_by_duration' => $comp->breakdownByDuration,
            'base_salary_minor'     => $comp->baseSalaryMinor,
        ]);

        $payroll->recomputeTotals();
        return $payroll;
    }

    private function autoAddLateReportDeduction(Payroll $payroll, Teacher $teacher, Carbon $start, Carbon $end): void
    {
        $deductionMinor = Setting::int('payroll.late_report_deduction_minor', 5000);
        if ($deductionMinor <= 0) return;

        $sessions = Session::where('teacher_id', $teacher->id)
            ->where('status', 'attended')
            ->whereBetween('scheduled_start', [$start, $end])
            ->pluck('id');

        $lateReports = SessionReport::whereIn('session_id', $sessions)
            ->whereRaw('created_at > DATE_ADD((SELECT scheduled_end FROM sys_sessions WHERE id = session_id), INTERVAL 24 HOUR)')
            ->count();

        if ($lateReports > 0) {
            PayrollAdjustment::create([
                'payroll_id'       => $payroll->id,
                'type'             => 'deduction',
                'category'         => 'late_report',
                'amount_minor'     => $deductionMinor,
                'reason'           => "Auto: {$lateReports} late report(s) this month",
                'added_by_user_id' => 1,
            ]);
        }
    }
}
