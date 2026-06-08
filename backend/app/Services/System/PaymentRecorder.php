<?php

namespace App\Services\System;

use App\Events\System\InvoicePaid;
use App\Events\System\PaymentRecorded;
use App\Models\System\Invoice;
use App\Models\System\Payment;
use Illuminate\Support\Facades\DB;

class PaymentRecorder
{
    public function __construct(private WalletService $wallet) {}

    public function record(Invoice $inv, array $data): Payment
    {
        abort_unless($data['currency'] === $inv->currency, 422, 'Payment currency must match invoice currency.');

        return DB::transaction(function () use ($inv, $data) {
            $p = Payment::create([
                'invoice_id'             => $inv->id,
                'amount_minor'           => $data['amount_minor'],
                'currency'               => $data['currency'],
                'method'                 => $data['method'],
                'reference'              => $data['reference'] ?? null,
                'gateway_transaction_id' => $data['gateway_transaction_id'] ?? null,
                'paid_at'                => $data['paid_at'] ?? now(),
                'recorded_by_user_id'    => auth()->id(),
                'payload'                => $data['payload'] ?? null,
            ]);

            $totalPaid = $inv->payments()->sum('amount_minor');
            if ($totalPaid >= $inv->total_minor) {
                $overpay = $totalPaid - $inv->total_minor;
                if ($overpay > 0) {
                    $this->wallet->credit($inv->student, $overpay, 'overpayment', $p, "From {$inv->invoice_number}");
                }
                $inv->update(['status' => 'paid', 'paid_at' => $p->paid_at]);
                event(new InvoicePaid($inv->fresh(), $p));
            }
            event(new PaymentRecorded($p));
            return $p;
        });
    }
}
