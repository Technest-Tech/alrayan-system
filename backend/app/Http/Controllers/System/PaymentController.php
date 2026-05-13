<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Payment\RecordPaymentRequest;
use App\Http\Resources\System\PaymentResource;
use App\Models\System\Invoice;
use App\Models\System\Payment;
use App\Services\System\PaymentRecorder;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Payment::class);
        $payments = QueryBuilder::for(Payment::class)
            ->allowedFilters(['method'])
            ->allowedSorts(['-paid_at'])
            ->defaultSort('-paid_at')
            ->with(['invoice.student'])
            ->paginate($request->integer('per_page', 25));
        return PaymentResource::collection($payments);
    }

    public function store(RecordPaymentRequest $request, Invoice $invoice, PaymentRecorder $recorder)
    {
        $this->authorize('recordPayment', $invoice);
        $payment = $recorder->record($invoice, $request->validated());
        return new PaymentResource($payment);
    }
}
