<?php

namespace App\Services\System;

use App\Events\System\InvoiceCreated;
use App\Jobs\System\CreatePaymobPaymentLink;
use App\Models\System\Invoice;
use App\Models\System\InvoiceLine;
use App\Models\System\Student;
use App\Support\System\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class InvoiceGenerator
{
    public function __construct(
        private PriceCalculator   $price,
        private ProRataCalculator $proRata,
        private InvoiceNumberer   $numberer,
        private WalletService     $wallet,
    ) {}

    public function generateMonthly(Student $s, int $year, int $month): Invoice
    {
        $existing = Invoice::where('student_id', $s->id)
            ->where('type', 'monthly')
            ->where('period_year', $year)
            ->where('period_month', $month)
            ->first();
        if ($existing) return $existing;

        $sub = $this->price->monthly($s);
        return DB::transaction(function () use ($s, $year, $month, $sub) {
            $inv = Invoice::create([
                'student_id'         => $s->id,
                'invoice_number'     => $this->numberer->next($year),
                'type'               => 'monthly',
                'period_year'        => $year,
                'period_month'       => $month,
                'currency'           => $s->currency,
                'subtotal_minor'     => $sub,
                'discount_minor'     => 0,
                'total_minor'        => $sub,
                'status'             => Setting::bool('invoice.send_on_create') ? 'sent' : 'draft',
                'issued_at'          => now(),
                'due_at'             => now()->addDays(Setting::int('invoice.due_days', 3)),
                'snapshot'           => $this->snapshot($s),
                'created_by_user_id' => auth()->id(),
            ]);
            InvoiceLine::create([
                'invoice_id'           => $inv->id,
                'kind'                 => 'monthly',
                'description'          => sprintf(
                    '%d sessions × %d min — %s %d',
                    $s->sessions_per_month,
                    $s->session_duration_min,
                    Carbon::create($year, $month, 1)->format('F'),
                    $year
                ),
                'quantity'             => $s->sessions_per_month,
                'session_duration_min' => $s->session_duration_min,
                'unit_price_minor'     => $s->sessions_per_month > 0
                    ? (int) floor($sub / $s->sessions_per_month)
                    : $sub,
                'line_total_minor'     => $sub,
            ]);
            $this->wallet->applyToInvoice($inv->fresh());
            if (config('system.features.paymob', false) && $inv->fresh()->total_minor > 0) {
                CreatePaymobPaymentLink::dispatch($inv);
            }
            event(new InvoiceCreated($inv->fresh()));
            return $inv->fresh();
        });
    }

    public function generateAdvance(Student $s, ?Carbon $effectiveFrom = null): Invoice
    {
        $monthly   = $this->price->monthly($s);
        $result    = $this->proRata->forCurrentMonth($monthly, now(), $effectiveFrom ?? now());
        $year      = now()->year;

        return DB::transaction(function () use ($s, $result, $year) {
            $inv = Invoice::create([
                'student_id'         => $s->id,
                'invoice_number'     => $this->numberer->next($year),
                'type'               => 'advance',
                'currency'           => $s->currency,
                'subtotal_minor'     => $result->amountMinor,
                'discount_minor'     => 0,
                'total_minor'        => $result->amountMinor,
                'status'             => Setting::bool('invoice.send_on_create') ? 'sent' : 'draft',
                'issued_at'          => now(),
                'due_at'             => now()->addDays(Setting::int('invoice.due_days', 3)),
                'snapshot'           => $this->snapshot($s),
                'created_by_user_id' => auth()->id(),
            ]);
            InvoiceLine::create([
                'invoice_id'       => $inv->id,
                'kind'             => 'pro_rata',
                'description'      => "Pro-rata: {$result->remainingDays} of {$result->daysInMonth} days in " . now()->format('F Y'),
                'quantity'         => 1,
                'unit_price_minor' => $result->amountMinor,
                'line_total_minor' => $result->amountMinor,
            ]);
            $this->wallet->applyToInvoice($inv->fresh());
            if (config('system.features.paymob', false) && $inv->fresh()->total_minor > 0) {
                CreatePaymobPaymentLink::dispatch($inv);
            }
            event(new InvoiceCreated($inv->fresh()));
            return $inv->fresh();
        });
    }

    public function generateReactivation(Student $s): Invoice
    {
        $outstanding = Invoice::where('student_id', $s->id)->open()->get();
        $monthly     = $this->price->monthly($s);
        $proResult   = $this->proRata->forCurrentMonth($monthly, now());
        $year        = now()->year;

        return DB::transaction(function () use ($s, $outstanding, $proResult, $year) {
            $subtotal = $outstanding->sum('total_minor') + $proResult->amountMinor;
            $inv = Invoice::create([
                'student_id'         => $s->id,
                'invoice_number'     => $this->numberer->next($year),
                'type'               => 'reactivation',
                'currency'           => $s->currency,
                'subtotal_minor'     => $subtotal,
                'discount_minor'     => 0,
                'total_minor'        => $subtotal,
                'status'             => Setting::bool('invoice.send_on_create') ? 'sent' : 'draft',
                'issued_at'          => now(),
                'due_at'             => now()->addDays(Setting::int('invoice.due_days', 3)),
                'snapshot'           => $this->snapshot($s),
                'created_by_user_id' => auth()->id(),
            ]);
            foreach ($outstanding as $oldInv) {
                InvoiceLine::create([
                    'invoice_id'        => $inv->id,
                    'kind'              => 'outstanding',
                    'description'       => "Outstanding: {$oldInv->invoice_number}",
                    'quantity'          => 1,
                    'unit_price_minor'  => $oldInv->total_minor,
                    'line_total_minor'  => $oldInv->total_minor,
                    'source_invoice_id' => $oldInv->id,
                ]);
                $oldInv->update([
                    'status'        => 'void',
                    'voided_at'     => now(),
                    'voided_reason' => "Combined into reactivation invoice {$inv->invoice_number}",
                ]);
            }
            InvoiceLine::create([
                'invoice_id'       => $inv->id,
                'kind'             => 'pro_rata',
                'description'      => "Pro-rata: {$proResult->remainingDays} of {$proResult->daysInMonth} days in " . now()->format('F Y'),
                'quantity'         => 1,
                'unit_price_minor' => $proResult->amountMinor,
                'line_total_minor' => $proResult->amountMinor,
            ]);
            $this->wallet->applyToInvoice($inv->fresh());
            if (config('system.features.paymob', false) && $inv->fresh()->total_minor > 0) {
                CreatePaymobPaymentLink::dispatch($inv);
            }
            event(new InvoiceCreated($inv->fresh()));
            return $inv->fresh();
        });
    }

    private function snapshot(Student $s): array
    {
        $s->loadMissing(['course', 'assignedTeacher.user']);
        return [
            'student_name'          => $s->name,
            'course_name'           => $s->course?->name,
            'teacher_name'          => $s->assignedTeacher?->user?->name,
            'sessions_per_month'    => $s->sessions_per_month,
            'session_duration_min'  => $s->session_duration_min,
            'currency'              => $s->currency,
        ];
    }
}
