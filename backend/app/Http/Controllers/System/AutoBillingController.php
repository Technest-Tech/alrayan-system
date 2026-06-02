<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Invoice;
use App\Models\System\Session;
use App\Models\System\Student;
use App\Models\System\WassenderLog;
use App\Services\Integrations\Wassender\WassenderClient;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Real-time "Automatic Billings" view.
 *
 * Builds a per-student row showing what they currently owe based on
 * actual session consumption (counts_against_quota math) — NOT the
 * flat contracted monthly fee. Each row exposes inline actions
 * (mark-paid, send-bill on WhatsApp) so support can reconcile from
 * one place without waiting for the monthly invoice cron.
 */
class AutoBillingController extends Controller
{
    /**
     * GET /api/system/billing/automatic?period=YYYY-MM&search=&status=paid|unpaid
     *
     * Returns the live billing table.
     */
    public function index(Request $request): JsonResponse
    {
        // Default to the current month if no period is supplied.
        $period = $request->query('period') ?: now()->format('Y-m');
        [$year, $month] = array_pad(explode('-', $period), 2, null);
        if (!$year || !$month) {
            return response()->json(['message' => 'period must be YYYY-MM'], 422);
        }
        $year  = (int) $year;
        $month = (int) $month;

        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end   = (clone $start)->endOfMonth();

        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');  // 'paid' | 'unpaid' | null

        // ── Aggregate sessions per student for the period ─────────────────────
        //
        // counts_against_quota is a computed accessor; we mirror its rule in
        // SQL here for performance:
        //   counted  := status='attended'
        //            OR (status='absent' AND cancelled_by='student' AND apology_received=false)
        //
        $countedExpr = "SUM(CASE
            WHEN status='attended' THEN 1
            WHEN status='absent' AND cancelled_by='student' AND apology_received=0 THEN 1
            ELSE 0
        END)";

        $freeExpr = "SUM(CASE
            WHEN status IN ('absent','cancelled') AND NOT (
                status='absent' AND cancelled_by='student' AND apology_received=0
            ) THEN 1
            ELSE 0
        END)";

        $rows = DB::table('sys_sessions')
            ->select('student_id',
                DB::raw("$countedExpr as counted_sessions"),
                DB::raw("$freeExpr    as free_sessions"),
                DB::raw('SUM(duration_min) as total_duration_min'),
                DB::raw("SUM(CASE
                    WHEN status='attended' THEN duration_min
                    WHEN status='absent' AND cancelled_by='student' AND apology_received=0 THEN duration_min
                    ELSE 0
                END) as counted_duration_min"),
            )
            ->whereNull('deleted_at')
            ->whereBetween('scheduled_start', [$start, $end])
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        if ($rows->isEmpty()) {
            return response()->json(['data' => [], 'meta' => $this->meta($period, 0, 0)]);
        }

        // ── Load the matching students + any monthly invoice in this period ──
        $studentIds = $rows->keys()->all();

        $studentsQuery = Student::query()
            ->whereIn('id', $studentIds)
            ->with(['course']);

        if ($search !== '') {
            $studentsQuery->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('whatsapp', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        $students = $studentsQuery->get()->keyBy('id');

        $invoices = Invoice::query()
            ->whereIn('student_id', $studentIds)
            ->where('type', 'monthly')
            ->where('period_year', $year)
            ->where('period_month', $month)
            ->get()
            ->keyBy('student_id');

        // ── Pull per-student session details for inline expansion ────────────
        $sessionsByStudent = Session::query()
            ->with(['teacher.user'])
            ->whereIn('student_id', $studentIds)
            ->whereBetween('scheduled_start', [$start, $end])
            ->orderBy('scheduled_start')
            ->get()
            ->groupBy('student_id');

        // ── Build the response rows ──────────────────────────────────────────
        $data = [];
        $totalCostMinor = 0;

        foreach ($students as $student) {
            $agg = $rows->get($student->id);
            if (!$agg) {
                continue;
            }

            // Per-session price: monthly_price / contracted sessions_per_month.
            $perSessionMinor = $student->sessions_per_month > 0
                ? (int) floor($student->monthly_price_minor / max($student->sessions_per_month, 1))
                : 0;

            $counted = (int) $agg->counted_sessions;
            $free    = (int) $agg->free_sessions;
            $totalCost = $counted * $perSessionMinor;

            $invoice = $invoices->get($student->id);
            $paid = $invoice && $invoice->status === 'paid';

            if ($status === 'paid' && !$paid)   continue;
            if ($status === 'unpaid' && $paid)  continue;

            $totalCostMinor += $totalCost;

            // Per-session detail rows for the inline expansion in the UI.
            $sessionRows = ($sessionsByStudent[$student->id] ?? collect())->map(function ($s) use ($perSessionMinor) {
                $counts = $s->counts_against_quota;
                return [
                    'id'                   => $s->id,
                    'scheduled_start'      => $s->scheduled_start?->toIso8601String(),
                    'scheduled_end'        => $s->scheduled_end?->toIso8601String(),
                    'duration_min'         => $s->duration_min,
                    'status'               => $s->status,
                    'cancelled_by'         => $s->cancelled_by,
                    'apology_received'     => (bool) $s->apology_received,
                    'quota_impact'         => $s->quota_impact,
                    'counts_against_quota' => $counts,
                    'teacher_name'         => optional($s->teacher?->user)->name,
                    'cost_minor'           => $counts ? $perSessionMinor : 0,
                ];
            })->values();

            // Last session (most recent in period) — for at-a-glance display.
            $lastIso = $sessionRows->isNotEmpty() ? $sessionRows->last()['scheduled_start'] : null;

            $data[] = [
                'student_id'              => $student->id,
                'student_name'            => $student->name,
                'whatsapp'                => $student->whatsapp,
                'currency'                => $student->currency,
                'monthly_price_minor'     => (int) $student->monthly_price_minor,
                'sessions_per_month'      => (int) $student->sessions_per_month,
                'session_duration_min'    => (int) $student->session_duration_min,
                'per_session_price_minor' => $perSessionMinor,
                'counted_sessions'        => $counted,
                'free_sessions'           => $free,
                'remaining_quota'         => max(0, (int) $student->sessions_per_month - $counted),
                'total_duration_min'      => (int) $agg->total_duration_min,
                'counted_duration_min'    => (int) $agg->counted_duration_min,
                'total_cost_minor'        => $totalCost,
                'paid'                    => $paid,
                'invoice_id'              => $invoice?->id,
                'invoice_status'          => $invoice?->status,
                'course_name'             => $student->course?->name,
                'last_session_at'         => $lastIso,
                'sessions'                => $sessionRows->toArray(),
            ];
        }

        // Sort by counted desc, then by name.
        usort($data, fn ($a, $b) => [$b['counted_sessions'], $a['student_name']]
            <=> [$a['counted_sessions'], $b['student_name']]);

        return response()->json([
            'data' => $data,
            'meta' => $this->meta($period, count($data), $totalCostMinor),
        ]);
    }

    /**
     * Mark this period's bill as paid for a single student.
     *
     * Creates (or updates) a monthly Invoice with status=paid so the
     * existing payment/accounting pipeline picks it up.
     */
    public function markPaid(Request $request, Student $student): JsonResponse
    {
        $this->authorize('view', $student);

        $data = $request->validate([
            'period' => ['required', 'regex:/^\d{4}-\d{2}$/'],
        ]);

        [$year, $month] = array_map('intval', explode('-', $data['period']));

        // Recompute the current period total so we store the correct amount.
        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end   = (clone $start)->endOfMonth();
        $counted = (int) Session::query()
            ->where('student_id', $student->id)
            ->whereBetween('scheduled_start', [$start, $end])
            ->where(function ($q) {
                $q->where('status', 'attended')
                  ->orWhere(function ($q) {
                      $q->where('status', 'absent')
                        ->where('cancelled_by', 'student')
                        ->where('apology_received', false);
                  });
            })
            ->count();

        $perSessionMinor = $student->sessions_per_month > 0
            ? (int) floor($student->monthly_price_minor / max($student->sessions_per_month, 1))
            : 0;
        $totalMinor = $counted * $perSessionMinor;

        $invoice = Invoice::firstOrNew([
            'student_id'   => $student->id,
            'type'         => 'monthly',
            'period_year'  => $year,
            'period_month' => $month,
        ]);
        if (!$invoice->exists) {
            $invoice->invoice_number = 'AUTO-' . $student->id . '-' . $year . str_pad((string) $month, 2, '0', STR_PAD_LEFT);
            $invoice->currency       = $student->currency;
            $invoice->subtotal_minor = $totalMinor;
            $invoice->total_minor    = $totalMinor;
            $invoice->due_at         = $start->copy()->addDays(7);
            $invoice->created_by_user_id = auth()->id();
            $invoice->snapshot       = [
                'sessions_per_month'     => $student->sessions_per_month,
                'monthly_price_minor'    => $student->monthly_price_minor,
                'per_session_price_minor'=> $perSessionMinor,
                'counted_sessions'       => $counted,
                'source'                 => 'auto_billing',
            ];
        }
        $invoice->status  = 'paid';
        $invoice->paid_at = now();
        $invoice->save();

        return response()->json([
            'message'    => 'Marked as paid.',
            'invoice_id' => $invoice->id,
        ]);
    }

    /**
     * Send the current bill summary to the student via WhatsApp (Wassender).
     */
    public function sendWhatsApp(Request $request, Student $student, WassenderClient $wassender): JsonResponse
    {
        $this->authorize('view', $student);

        $data = $request->validate([
            'period' => ['required', 'regex:/^\d{4}-\d{2}$/'],
        ]);

        if (!$student->whatsapp && !$student->phone) {
            return response()->json(['message' => 'Student has no WhatsApp/phone on file.'], 422);
        }
        $phone = preg_replace('/\s|-/', '', $student->whatsapp ?: $student->phone);

        [$year, $month] = array_map('intval', explode('-', $data['period']));
        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end   = (clone $start)->endOfMonth();

        $counted = (int) Session::query()
            ->where('student_id', $student->id)
            ->whereBetween('scheduled_start', [$start, $end])
            ->where(function ($q) {
                $q->where('status', 'attended')
                  ->orWhere(function ($q) {
                      $q->where('status', 'absent')
                        ->where('cancelled_by', 'student')
                        ->where('apology_received', false);
                  });
            })
            ->count();

        $perSessionMinor = $student->sessions_per_month > 0
            ? (int) floor($student->monthly_price_minor / max($student->sessions_per_month, 1))
            : 0;
        $totalMinor = $counted * $perSessionMinor;
        $totalFmt   = number_format($totalMinor / 100, 2) . ' ' . $student->currency;
        $perFmt     = number_format($perSessionMinor / 100, 2) . ' ' . $student->currency;

        $periodLabel = $start->format('F Y');

        // Ensure a draft invoice exists for this (student, period) so we
        // can attach a payable link to the WhatsApp message. Existing
        // invoices are reused (their payment_token survives).
        $invoice = Invoice::firstOrNew([
            'student_id'   => $student->id,
            'type'         => 'monthly',
            'period_year'  => $year,
            'period_month' => $month,
        ]);
        if (!$invoice->exists) {
            $invoice->invoice_number = 'AUTO-' . $student->id . '-' . $year . str_pad((string) $month, 2, '0', STR_PAD_LEFT);
            $invoice->currency       = $student->currency;
            $invoice->subtotal_minor = $totalMinor;
            $invoice->total_minor    = $totalMinor;
            $invoice->status         = 'sent';
            $invoice->issued_at      = now();
            $invoice->due_at         = $start->copy()->addDays(7);
            $invoice->payment_token  = Str::random(48);
            $invoice->created_by_user_id = auth()->id();
            $invoice->snapshot       = [
                'sessions_per_month'      => $student->sessions_per_month,
                'monthly_price_minor'     => $student->monthly_price_minor,
                'per_session_price_minor' => $perSessionMinor,
                'counted_sessions'        => $counted,
                'source'                  => 'auto_billing',
            ];
            $invoice->save();
        } elseif (!$invoice->payment_token) {
            $invoice->payment_token = Str::random(48);
            $invoice->save();
        }

        $payUrl = rtrim(config('system.frontend_url', config('app.url')), '/')
            . '/pay/' . $invoice->payment_token;

        $msg = implode("\n", [
            "🌙 *Al-Rayan Academy — Monthly Bill*",
            "━━━━━━━━━━━━━━━━━━━━━━",
            "",
            "Assalamu Alaikum,",
            "",
            "Here is the session summary for *{$student->name}* for *{$periodLabel}*:",
            "",
            "📚 Sessions completed: *{$counted}*",
            "💵 Per session: {$perFmt}",
            "🧾 Total due: *{$totalFmt}*",
            "",
            "💳 *Pay online:*",
            $payUrl,
            "",
            "Jazakum Allahu Khayran 🌿",
            "*Al-Rayan Academy Team*",
        ]);

        $result = $wassender->sendToPhone($phone, $msg);

        WassenderLog::create([
            'template_key'        => 'auto_billing.bill_sent',
            'recipient_phone'     => $phone,
            'rendered_message'    => $msg,
            'status'              => $result->success ? 'sent' : 'failed',
            'external_message_id' => $result->externalId,
            'attempt_count'       => 1,
            'error'               => $result->success ? null : $result->errorBody,
            'payload'             => [
                'student_id'  => $student->id,
                'period'      => $data['period'],
                'total_minor' => $totalMinor,
                'counted'     => $counted,
            ],
            'sent_at'             => $result->success ? now() : null,
        ]);

        if (!$result->success) {
            return response()->json([
                'message' => 'WhatsApp send failed.',
                'error'   => $result->errorBody,
            ], 502);
        }

        return response()->json([
            'message'   => 'Bill sent on WhatsApp.',
            'recipient' => $phone,
        ]);
    }

    private function meta(string $period, int $count, int $totalCostMinor): array
    {
        return [
            'period'            => $period,
            'row_count'         => $count,
            'total_cost_minor'  => $totalCostMinor,
        ];
    }
}
