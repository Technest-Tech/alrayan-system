<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Payroll\ExportRequest;
use App\Jobs\System\BuildPayrollExport;

class PayrollExportController extends Controller
{
    public function __invoke(ExportRequest $request)
    {
        BuildPayrollExport::dispatch($request->period, $request->format, $request->user()->id);
        return response()->json(['message' => 'Export queued. You will be notified when ready.']);
    }
}
