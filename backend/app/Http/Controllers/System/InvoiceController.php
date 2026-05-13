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
use App\Services\System\InvoiceGenerator;
use App\Services\System\InvoiceNumberer;
use App\Services\System\InvoicePdfRenderer;
use App\Services\System\StudentBillingState;
use Carbon\Carbon;
use Illuminate\Http\Request;
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
        $invoice->load(['student', 'lines', 'payments.recordedBy', 'paymobLink', 'createdBy']);
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

    public function resendPaymobLink(Invoice $invoice)
    {
        $this->authorize('resendLink', $invoice);
        \App\Jobs\System\RegeneratePaymobPaymentLink::dispatch($invoice);
        return response()->json(['ok' => true, 'message' => 'Paymob link regeneration queued.']);
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
