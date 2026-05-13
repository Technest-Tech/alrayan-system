<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\MonthlyReportResource;
use App\Models\System\MonthlyReport;
use App\Services\System\MonthlyReportGenerator;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonthlyReportController extends Controller
{
    public function index(): JsonResponse
    {
        $reports = MonthlyReport::orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->paginate(24);

        return response()->json(MonthlyReportResource::collection($reports)->response()->getData(true));
    }

    public function showPdf(int $id): JsonResponse
    {
        $report = MonthlyReport::findOrFail($id);
        if (!$report->pdf_path) {
            return response()->json(['message' => 'PDF not yet generated.'], 404);
        }
        return response()->json(['url' => $report->pdf_path]);
    }

    public function showXlsx(int $id): JsonResponse
    {
        $report = MonthlyReport::findOrFail($id);
        if (!$report->xlsx_path) {
            return response()->json(['message' => 'Excel file not yet generated.'], 404);
        }
        return response()->json(['url' => $report->xlsx_path]);
    }

    public function regenerate(Request $request, MonthlyReportGenerator $generator): JsonResponse
    {
        $data = $request->validate([
            'year'  => ['required', 'integer'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $report = $generator->generate($data['year'], $data['month'], $request->user());
        return response()->json(['data' => new MonthlyReportResource($report)]);
    }
}
