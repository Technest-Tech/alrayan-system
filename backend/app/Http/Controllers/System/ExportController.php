<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Jobs\System\BuildExport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    private const ALLOWED_KINDS = [
        'students', 'teachers', 'invoices', 'payroll',
        'attendance', 'cancellation_report', 'trial_analytics',
        'profit_loss', 'audit_log',
    ];

    public function index(): JsonResponse
    {
        return response()->json(['data' => array_map(fn($k) => ['kind' => $k, 'label' => ucwords(str_replace('_', ' ', $k))], self::ALLOWED_KINDS)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kind'    => ['required', 'string', 'in:' . implode(',', self::ALLOWED_KINDS)],
            'filters' => ['nullable', 'array'],
        ]);

        BuildExport::dispatch(
            kind: $data['kind'],
            filters: $data['filters'] ?? [],
            userId: $request->user()->id,
        );

        return response()->json(['message' => 'Export queued. You will be notified when ready.']);
    }
}
