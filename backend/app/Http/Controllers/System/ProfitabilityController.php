<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Services\System\AuditLog;
use App\Services\System\TeacherProfitabilityService;
use App\Support\System\ProfitabilityConfig;
use App\Support\System\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfitabilityController extends Controller
{
    public function __construct(private readonly TeacherProfitabilityService $profitability) {}

    /** Per-teacher income → cost → margin → net profit for one month. */
    public function index(Request $request): JsonResponse
    {
        $month = $request->query('month');
        $month = is_string($month) && preg_match('/^\d{4}-\d{2}$/', $month) ? $month : null;

        $currency = $request->query('currency');
        $currency = is_string($currency) && preg_match('/^[A-Za-z]{3}$/', $currency) ? strtoupper($currency) : null;

        return response()->json($this->profitability->report($month, $currency));
    }

    /**
     * Save the percentage lines / partner split / default currency. These are
     * academy-wide business constants, so they persist rather than living in the
     * viewer's session — everyone reading the report sees the same numbers.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'deductions'             => ['sometimes', 'array', 'max:' . ProfitabilityConfig::MAX_DEDUCTIONS],
            'deductions.*.key'       => ['required', 'string', 'max:40'],
            'deductions.*.label'     => ['required', 'string', 'max:40'],
            'deductions.*.percent'   => ['required', 'numeric', 'min:0', 'max:100'],
            'partner_count'          => ['sometimes', 'integer', 'min:0', 'max:20'],
            'report_currency'        => ['sometimes', 'string', 'size:3'],
        ]);

        if (array_key_exists('deductions', $data)) {
            Setting::set(
                ProfitabilityConfig::DEDUCTIONS_KEY,
                json_encode(ProfitabilityConfig::normalize($data['deductions'])),
            );
        }

        if (array_key_exists('partner_count', $data)) {
            Setting::set(ProfitabilityConfig::PARTNERS_KEY, (string) $data['partner_count']);
        }

        if (array_key_exists('report_currency', $data)) {
            Setting::set(ProfitabilityConfig::CURRENCY_KEY, strtoupper($data['report_currency']));
        }

        AuditLog::record('accounting.profitability_settings_updated', $request->user(), $data);

        return response()->json([
            'deductions'      => ProfitabilityConfig::deductions(),
            'partner_count'   => ProfitabilityConfig::partnerCount(),
            'report_currency' => Setting::get(ProfitabilityConfig::CURRENCY_KEY),
        ]);
    }
}
