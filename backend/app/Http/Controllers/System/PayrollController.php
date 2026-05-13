<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Payroll\ApproveRequest;
use App\Http\Requests\System\Payroll\BulkApproveRequest;
use App\Http\Requests\System\Payroll\BulkTransferRequest;
use App\Http\Requests\System\Payroll\MarkTransferredRequest;
use App\Http\Requests\System\Payroll\PreviewRequest;
use App\Http\Requests\System\Payroll\RecalcRequest;
use App\Http\Requests\System\Payroll\RejectRequest;
use App\Http\Resources\System\PayrollDetailResource;
use App\Http\Resources\System\PayrollResource;
use App\Models\System\Payroll;
use App\Models\System\Teacher;
use App\Services\System\PayrollApprover;
use App\Services\System\PayrollCalculator;
use App\Services\System\PayrollGenerator;
use App\Services\System\SalarySlipPdfRenderer;
use App\Services\System\SalaryStatementBuilder;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Payroll::class);
        $payrolls = QueryBuilder::for(Payroll::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('period_year'),
                AllowedFilter::exact('period_month'),
                AllowedFilter::exact('teacher_id'),
            ])
            ->allowedSorts(['period_year', 'period_month', 'net_salary_minor', 'created_at'])
            ->defaultSort('-period_year', '-period_month')
            ->with('teacher.user')
            ->paginate($request->integer('per_page', 50));
        return PayrollResource::collection($payrolls);
    }

    public function show(Payroll $payroll)
    {
        $this->authorize('view', $payroll);
        $payroll->load(['teacher.user', 'adjustments.addedBy', 'approver']);
        return new PayrollDetailResource($payroll);
    }

    public function preview(PreviewRequest $request, PayrollCalculator $calc)
    {
        $teacher = Teacher::findOrFail($request->teacher_id);
        $start   = Carbon::create($request->year, $request->month, 1)->startOfMonth()->utc();
        $end     = $start->copy()->endOfMonth()->addDay()->startOfDay();
        $comp    = $calc->calculate($teacher, $start, $end);
        return response()->json([
            'total_sessions'        => $comp->totalSessions,
            'total_minutes'         => $comp->totalMinutes,
            'breakdown_by_duration' => $comp->breakdownByDuration,
            'base_salary_minor'     => $comp->baseSalaryMinor,
            'rate_snapshot'         => $comp->rateSnapshot,
        ]);
    }

    public function approve(ApproveRequest $request, Payroll $payroll, PayrollApprover $approver)
    {
        $this->authorize('approve', $payroll);
        return new PayrollDetailResource(
            $approver->approve($payroll, $request->user())->load(['teacher.user', 'adjustments'])
        );
    }

    public function reject(RejectRequest $request, Payroll $payroll, PayrollApprover $approver)
    {
        $this->authorize('approve', $payroll);
        return new PayrollDetailResource(
            $approver->reject($payroll, $request->user(), $request->reason)->load(['teacher.user', 'adjustments'])
        );
    }

    public function markTransferred(MarkTransferredRequest $request, Payroll $payroll, PayrollApprover $approver)
    {
        $this->authorize('markTransferred', $payroll);
        return new PayrollDetailResource(
            $approver->markTransferred($payroll, $request->user(), $request->transfer_reference)->load(['teacher.user', 'adjustments'])
        );
    }

    public function recalculate(RecalcRequest $request, Payroll $payroll, PayrollGenerator $gen)
    {
        $this->authorize('adjust', $payroll);
        return new PayrollDetailResource(
            $gen->regenerate($payroll)->load(['teacher.user', 'adjustments'])
        );
    }

    public function bulkApprove(BulkApproveRequest $request, PayrollApprover $approver)
    {
        DB::transaction(function () use ($request, $approver) {
            Payroll::whereIn('id', $request->ids)->each(fn($p) => $approver->approve($p, $request->user()));
        });
        return response()->json(['message' => 'Bulk approved.']);
    }

    public function bulkTransfer(BulkTransferRequest $request, PayrollApprover $approver)
    {
        DB::transaction(function () use ($request, $approver) {
            foreach ($request->items as $item) {
                $p = Payroll::findOrFail($item['id']);
                $approver->markTransferred($p, $request->user(), $item['transfer_reference']);
            }
        });
        return response()->json(['message' => 'Bulk transferred.']);
    }

    public function teacherPayrolls(Request $request, Teacher $teacher)
    {
        $payrolls = Payroll::where('teacher_id', $teacher->id)
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->paginate($request->integer('per_page', 24));
        return PayrollResource::collection($payrolls);
    }

    public function pdf(Payroll $payroll, SalarySlipPdfRenderer $renderer)
    {
        $this->authorize('view', $payroll);
        $content = $renderer->render($payroll);
        return response($content, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="salary-slip-' . $payroll->period_year . '-' . str_pad($payroll->period_month, 2, '0', STR_PAD_LEFT) . '.pdf"',
        ]);
    }

    public function salaryStatement(Request $request, Teacher $teacher, SalaryStatementBuilder $builder)
    {
        $stmt = $builder->forTeacher($teacher, $request->integer('year') ?: null, $request->integer('month') ?: null);
        return response()->json([
            'teacher' => [
                'id'             => $stmt->teacher->id,
                'name'           => $stmt->teacher->user->name,
                'payment_method' => $stmt->teacher->payment_method,
            ],
            'current' => $stmt->current ? new PayrollDetailResource($stmt->current) : null,
            'history' => PayrollResource::collection($stmt->history),
        ]);
    }
}
