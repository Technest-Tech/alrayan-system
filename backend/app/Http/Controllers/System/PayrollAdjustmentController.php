<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\PayrollAdjustment\StoreAdjustmentRequest;
use App\Http\Requests\System\PayrollAdjustment\UpdateAdjustmentRequest;
use App\Http\Resources\System\PayrollAdjustmentResource;
use App\Models\System\Payroll;
use App\Models\System\PayrollAdjustment;

class PayrollAdjustmentController extends Controller
{
    public function store(StoreAdjustmentRequest $request, Payroll $payroll)
    {
        $this->authorize('adjust', $payroll);
        $adj = $payroll->adjustments()->create([
            'type'             => $request->type,
            'category'         => $request->category,
            'amount_minor'     => $request->amount_minor,
            'reason'           => $request->reason,
            'added_by_user_id' => $request->user()->id,
        ]);
        $payroll->recomputeTotals();
        return new PayrollAdjustmentResource($adj->load('addedBy'));
    }

    public function update(UpdateAdjustmentRequest $request, PayrollAdjustment $payrollAdjustment)
    {
        $this->authorize('adjust', $payrollAdjustment->payroll);
        $payrollAdjustment->update($request->validated());
        $payrollAdjustment->payroll->recomputeTotals();
        return new PayrollAdjustmentResource($payrollAdjustment->fresh()->load('addedBy'));
    }

    public function destroy(PayrollAdjustment $payrollAdjustment)
    {
        $this->authorize('adjust', $payrollAdjustment->payroll);
        $payroll = $payrollAdjustment->payroll;
        $payrollAdjustment->delete();
        $payroll->recomputeTotals();
        return response()->noContent();
    }
}
