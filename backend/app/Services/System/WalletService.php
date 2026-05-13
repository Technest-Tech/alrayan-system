<?php

namespace App\Services\System;

use App\Models\System\Invoice;
use App\Models\System\Student;
use App\Models\System\WalletTransaction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class WalletService
{
    public function credit(Student $s, int $amountMinor, string $source, ?Model $sourceRef = null, ?string $note = null): WalletTransaction
    {
        return $this->writeEntry($s, +abs($amountMinor), $source, $sourceRef, $note);
    }

    public function debit(Student $s, int $amountMinor, string $source, ?Model $sourceRef = null, ?string $note = null): WalletTransaction
    {
        return $this->writeEntry($s, -abs($amountMinor), $source, $sourceRef, $note);
    }

    private function writeEntry(Student $s, int $delta, string $source, ?Model $ref, ?string $note): WalletTransaction
    {
        return DB::transaction(function () use ($s, $delta, $source, $ref, $note) {
            $s          = Student::lockForUpdate()->find($s->id);
            $newBalance = $s->wallet_balance_minor + $delta;
            $tx = WalletTransaction::create([
                'student_id'            => $s->id,
                'amount_minor'          => $delta,
                'currency'              => $s->currency,
                'source'                => $source,
                'source_reference_type' => $ref?->getMorphClass(),
                'source_reference_id'   => $ref?->getKey(),
                'note'                  => $note,
                'balance_after_minor'   => $newBalance,
                'actor_user_id'         => auth()->id(),
            ]);
            $s->update(['wallet_balance_minor' => $newBalance]);
            return $tx;
        });
    }

    public function applyToInvoice(Invoice $inv): int
    {
        $s = $inv->student;
        if ($s->wallet_balance_minor <= 0) return 0;
        if ($s->currency !== $inv->currency) return 0;
        $apply = min($s->wallet_balance_minor, $inv->total_minor);
        if ($apply <= 0) return 0;
        $this->debit($s, $apply, 'invoice_credit', $inv, "Applied to {$inv->invoice_number}");
        $inv->update([
            'wallet_credit_minor' => $inv->wallet_credit_minor + $apply,
            'total_minor'         => max(0, $inv->total_minor - $apply),
        ]);
        return $apply;
    }
}
