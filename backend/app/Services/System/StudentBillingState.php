<?php

namespace App\Services\System;

use App\Models\System\Invoice;
use App\Models\System\Student;

class StudentBillingState
{
    public function __construct(private ProRataCalculator $proRata, private PriceCalculator $price) {}

    public function outstandingFor(Student $s): \Illuminate\Database\Eloquent\Collection
    {
        return Invoice::where('student_id', $s->id)->open()->with('lines')->get();
    }

    public function reactivationPreview(Student $s): array
    {
        $outstanding = $this->outstandingFor($s);
        $proResult   = $this->proRata->forCurrentMonth($s, now());
        $total       = $outstanding->sum('total_minor') + $proResult->amountMinor;
        return [
            'outstanding'  => $outstanding->map(fn($i) => ['number' => $i->invoice_number, 'amount_minor' => $i->total_minor]),
            'pro_rata'     => [
                'amount_minor'         => $proResult->amountMinor,
                'sessions_in_month'    => $proResult->sessionsInMonth,
                'remaining_sessions'   => $proResult->remainingSessions,
                'per_session_minor'    => $proResult->perSessionPriceMinor,
                'monthly_minor'        => $proResult->monthlyPriceMinor,
            ],
            'total_minor'  => $total,
            'currency'     => $s->currency,
        ];
    }
}
