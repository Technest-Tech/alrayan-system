<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Jobs\System\BuildBillingExport;
use App\Models\System\Invoice;
use Illuminate\Http\Request;

class BillingExportController extends Controller
{
    public function __invoke(Request $request)
    {
        $this->authorize('export', Invoice::class);
        BuildBillingExport::dispatch(
            $request->input('filter', []),
            $request->input('format', 'xlsx'),
            auth()->id()
        );
        return response()->json(['ok' => true, 'message' => 'Export queued.']);
    }
}
