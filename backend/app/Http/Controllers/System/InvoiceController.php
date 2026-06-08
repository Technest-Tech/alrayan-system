<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Invoice\StoreInvoiceRequest;
use App\Http\Requests\System\Invoice\UpdateInvoiceRequest;
use App\Http\Requests\System\Invoice\VoidInvoiceRequest;
use App\Http\Resources\System\InvoiceDetailResource;
use App\Http\Resources\System\InvoiceResource;
use App\Models\System\Invoice;
use App\Models\System\InvoiceLine;
use App\Models\System\Student;
use App\Models\System\WassenderLog;
use App\Services\Integrations\Wassender\WassenderClient;
use App\Services\System\InvoiceGenerator;
use App\Services\System\InvoiceNumberer;
use App\Services\System\InvoicePdfRenderer;
use App\Services\System\StudentBillingState;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);
        $invoices = QueryBuilder::for(Invoice::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('currency'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('student_id'),
                AllowedFilter::exact('period_year'),
                AllowedFilter::exact('period_month'),
            ])
            ->allowedSorts(['due_at', 'issued_at', 'total_minor', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['student', 'lines'])
            ->paginate($request->integer('per_page', 25));
        return InvoiceResource::collection($invoices);
    }

    public function show(Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        $invoice->load(['student', 'lines', 'payments.recordedBy', 'xpayLink', 'createdBy']);
        return new InvoiceDetailResource($invoice);
    }

    public function store(StoreInvoiceRequest $request, InvoiceGenerator $gen)
    {
        $this->authorize('create', Invoice::class);
        $student = Student::findOrFail($request->student_id);
        $inv = match($request->type) {
            'advance'      => $gen->generateAdvance($student, $request->effective_from ? Carbon::parse($request->effective_from) : null),
            'reactivation' => $gen->generateReactivation($student),
            default        => $this->createManual($request, $student),
        };
        return new InvoiceDetailResource($inv->load(['student', 'lines']));
    }

    private function createManual(StoreInvoiceRequest $req, Student $student): Invoice
    {
        $student->loadMissing(['course', 'assignedTeacher.user']);
        $subtotal = collect($req->lines)->sum('line_total_minor');
        $inv = Invoice::create([
            'student_id'         => $student->id,
            'invoice_number'     => app(InvoiceNumberer::class)->next(now()->year),
            'type'               => 'manual',
            'currency'           => $student->currency,
            'subtotal_minor'     => $subtotal,
            'discount_minor'     => 0,
            'total_minor'        => $subtotal,
            'status'             => 'draft',
            'issued_at'          => now(),
            'due_at'             => Carbon::parse($req->due_at),
            'created_by_user_id' => auth()->id(),
            'snapshot'           => [
                'student_name'         => $student->name,
                'course_name'          => $student->course?->name,
                'teacher_name'         => $student->assignedTeacher?->user?->name,
                'sessions_per_month'   => $student->sessions_per_month,
                'session_duration_min' => $student->session_duration_min,
                'currency'             => $student->currency,
                'description'          => $req->lines[0]['description'] ?? null,
            ],
        ]);
        foreach ($req->lines as $line) {
            InvoiceLine::create([...$line, 'invoice_id' => $inv->id]);
        }
        return $inv;
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);
        $invoice->update($request->validated());
        return new InvoiceDetailResource($invoice->fresh()->load(['student', 'lines']));
    }

    public function void(VoidInvoiceRequest $request, Invoice $invoice)
    {
        $this->authorize('void', $invoice);
        $invoice->update(['status' => 'void', 'voided_at' => now(), 'voided_reason' => $request->reason]);
        event(new \App\Events\System\InvoiceVoided($invoice));
        return new InvoiceDetailResource($invoice->fresh());
    }

    public function send(Invoice $invoice)
    {
        $this->authorize('send', $invoice);
        $invoice->update(['status' => 'sent', 'issued_at' => $invoice->issued_at ?? now()]);
        return new InvoiceDetailResource($invoice->fresh());
    }

    public function pdf(Invoice $invoice, InvoicePdfRenderer $renderer)
    {
        $this->authorize('downloadPdf', $invoice);
        $content = $renderer->render($invoice);
        return response($content, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $invoice->invoice_number . '.pdf"',
        ]);
    }

    public function resendXPayLink(Invoice $invoice)
    {
        $this->authorize('resendLink', $invoice);
        \App\Jobs\System\RegenerateXPayPaymentLink::dispatch($invoice);
        return response()->json(['ok' => true, 'message' => 'XPay link regeneration queued.']);
    }

    /**
     * Return the sessions covered by this invoice's period — with each
     * session's quota impact (counted / no-show / free) and computed cost.
     * Used by the invoice detail page to show actual consumption alongside
     * the contracted-quantity line items.
     */
    public function sessions(Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $invoice->load('student');
        $student = $invoice->student;
        if (!$student) {
            return response()->json(['data' => [], 'meta' => ['counted' => 0, 'free' => 0, 'total_cost_minor' => 0]]);
        }

        // Resolve the period window. For non-monthly invoices fall back to
        // the invoice's issued/created month so the panel always renders.
        if ($invoice->period_year && $invoice->period_month) {
            $start = Carbon::create($invoice->period_year, $invoice->period_month, 1)->startOfMonth();
        } else {
            $start = ($invoice->issued_at ?? $invoice->created_at ?? now())->copy()->startOfMonth();
        }
        $end = (clone $start)->endOfMonth();

        $sessions = \App\Models\System\Session::with(['teacher.user'])
            ->where('student_id', $student->id)
            ->whereBetween('scheduled_start', [$start, $end])
            ->orderBy('scheduled_start')
            ->get();

        // Per-session price: prefer (subtotal_minor / sessions_per_month) so
        // it tracks the invoice's own pricing, otherwise compute from student.
        $perSessionMinor = 0;
        if ($student->sessions_per_month > 0) {
            $perSessionMinor = (int) floor(
                ($invoice->subtotal_minor > 0 ? $invoice->subtotal_minor : $student->monthly_price_minor)
                / max($student->sessions_per_month, 1)
            );
        }

        $counted = 0;
        $free    = 0;
        $rows    = $sessions->map(function ($s) use ($perSessionMinor, &$counted, &$free) {
            $impact = $s->quota_impact;
            $counts = $s->counts_against_quota;
            if ($counts) $counted++; else $free++;
            return [
                'id'                   => $s->id,
                'scheduled_start'      => $s->scheduled_start?->toIso8601String(),
                'scheduled_end'        => $s->scheduled_end?->toIso8601String(),
                'duration_min'         => $s->duration_min,
                'status'               => $s->status,
                'cancelled_by'         => $s->cancelled_by,
                'apology_received'     => (bool) $s->apology_received,
                'quota_impact'         => $impact,
                'counts_against_quota' => $counts,
                'has_report'           => $s->report !== null,
                'teacher_name'         => optional($s->teacher?->user)->name,
                'cost_minor'           => $counts ? $perSessionMinor : 0,
            ];
        });

        return response()->json([
            'data' => $rows,
            'meta' => [
                'counted'                 => $counted,
                'free'                    => $free,
                'per_session_price_minor' => $perSessionMinor,
                'total_cost_minor'        => $counted * $perSessionMinor,
                'currency'                => $invoice->currency,
                'period_start'            => $start->toDateString(),
                'period_end'              => $end->toDateString(),
            ],
        ]);
    }

    /**
     * Flip an invoice to paid (manual reconciliation, e.g. cash/bank transfer).
     */
    public function markPaid(Invoice $invoice)
    {
        $this->authorize('update', $invoice);
        if ($invoice->status === 'paid') {
            return new InvoiceDetailResource($invoice);
        }
        $invoice->update(['status' => 'paid', 'paid_at' => now()]);
        return new InvoiceDetailResource($invoice->fresh());
    }

    /**
     * Render and send the bill message — with payment link — to the student's
     * WhatsApp via Wassender. Works for any invoice type (monthly / advance /
     * reactivation / manual).
     */
    public function sendWhatsApp(Invoice $invoice, WassenderClient $wassender)
    {
        $this->authorize('view', $invoice);

        $invoice->load('student');
        $student = $invoice->student;
        if (!$student) {
            return response()->json(['message' => 'Invoice has no student.'], 422);
        }
        $phone = $student->whatsapp ?: $student->phone;
        if (!$phone) {
            return response()->json(['message' => 'Student has no WhatsApp/phone on file.'], 422);
        }
        $cleanPhone = preg_replace('/\s|-/', '', $phone);

        // Ensure a payment token exists so we can include a live pay link.
        if (!$invoice->payment_token) {
            $invoice->update(['payment_token' => Str::random(48)]);
        }
        $payUrl = rtrim(config('system.frontend_url', config('app.url')), '/')
            . '/pay/' . $invoice->payment_token;

        $totalFmt = number_format($invoice->total_minor / 100, 2) . ' ' . $invoice->currency;
        $typeLabel = match ($invoice->type) {
            'monthly'      => 'Monthly Bill',
            'advance'      => 'Pro-rata Advance Bill',
            'reactivation' => 'Reactivation Bill',
            'manual'       => 'Bill',
            default        => 'Bill',
        };
        $dueWhen = $invoice->due_at?->format('d M Y') ?? 'soon';

        $msg = implode("\n", array_filter([
            "🌙 *Al-Rayan Academy — {$typeLabel}*",
            "━━━━━━━━━━━━━━━━━━━━━━",
            '',
            "Assalamu Alaikum,",
            '',
            "Invoice for *{$student->name}*",
            "🧾 #{$invoice->invoice_number}",
            "💰 Total: *{$totalFmt}*",
            "📅 Due: {$dueWhen}",
            '',
            "💳 *Pay online:*",
            $payUrl,
            '',
            "Jazakum Allahu Khayran 🌿",
            "*Al-Rayan Academy Team*",
        ]));

        $result = $wassender->sendToPhone($cleanPhone, $msg);

        WassenderLog::create([
            'template_key'        => 'invoice.bill_sent',
            'recipient_phone'     => $cleanPhone,
            'rendered_message'    => $msg,
            'status'              => $result->success ? 'sent' : 'failed',
            'external_message_id' => $result->externalId,
            'attempt_count'       => 1,
            'error'               => $result->success ? null : $result->errorBody,
            'payload'             => [
                'invoice_id' => $invoice->id,
                'student_id' => $student->id,
                'type'       => $invoice->type,
            ],
            'sent_at'             => $result->success ? now() : null,
        ]);

        if (!$result->success) {
            return response()->json([
                'message' => 'WhatsApp send failed.',
                'error'   => $result->errorBody,
            ], 502);
        }

        // Bump status to 'sent' (if still draft) so the dashboard reflects it.
        if ($invoice->status === 'draft') {
            $invoice->update(['status' => 'sent', 'issued_at' => $invoice->issued_at ?? now()]);
        }

        return response()->json([
            'message'   => 'Bill sent on WhatsApp.',
            'recipient' => $cleanPhone,
        ]);
    }

    public function studentInvoices(Request $request, Student $student)
    {
        $this->authorize('viewAny', Invoice::class);
        $invoices = Invoice::where('student_id', $student->id)
            ->with(['lines', 'payments'])
            ->latest()
            ->paginate($request->integer('per_page', 25));
        return InvoiceResource::collection($invoices);
    }

    public function advanceInvoice(Request $request, Student $student, InvoiceGenerator $gen)
    {
        $this->authorize('createAdvance', Invoice::class);
        $effectiveFrom = $request->has('effective_from') ? Carbon::parse($request->effective_from) : null;
        $inv = $gen->generateAdvance($student, $effectiveFrom);
        return new InvoiceDetailResource($inv->load(['student', 'lines']));
    }

    public function reactivationInvoice(Request $request, Student $student, InvoiceGenerator $gen)
    {
        $this->authorize('create', Invoice::class);
        $inv = $gen->generateReactivation($student);
        return new InvoiceDetailResource($inv->load(['student', 'lines']));
    }

    public function billingState(Student $student, StudentBillingState $state)
    {
        $this->authorize('viewAny', Invoice::class);
        return response()->json(['ok' => true, ...$state->reactivationPreview($student)]);
    }

    public function transitionPrepare(Request $request, Student $student, StudentBillingState $state)
    {
        abort_unless(auth()->user()->can('students.change_status'), 403);
        $to = $request->input('to');
        if ($to !== 'active') {
            return response()->json(['ok' => true, 'billing_required' => false]);
        }
        $preview = $state->reactivationPreview($student);
        return response()->json([
            'ok'               => true,
            'billing_required' => true,
            'preview'          => $preview,
        ]);
    }

    public function export(Request $request)
    {
        $this->authorize('export', Invoice::class);
        $jobId = \App\Jobs\System\BuildBillingExport::dispatch(
            $request->input('filter', []),
            $request->input('format', 'xlsx'),
            auth()->id()
        )->getJobId();
        return response()->json(['ok' => true, 'job_id' => $jobId, 'message' => 'Export queued. You will be notified when ready.']);
    }
}
