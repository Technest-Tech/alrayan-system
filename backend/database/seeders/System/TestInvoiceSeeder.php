<?php

namespace Database\Seeders\System;

use App\Models\System\Invoice;
use App\Models\System\InvoiceLine;
use App\Models\System\Student;
use App\Models\User;
use App\Services\System\InvoiceNumberer;
use Illuminate\Database\Seeder;

class TestInvoiceSeeder extends Seeder
{
    public function run(): void
    {
        $students = Student::with('course')
            ->whereNotIn('status', ['withdrawn'])
            ->inRandomOrder()
            ->limit(9)
            ->get();

        if ($students->count() < 3) {
            $this->command->warn('TestInvoiceSeeder: need at least 3 students in the database.');
            return;
        }

        // Pad to 9 by cycling if fewer than 9
        while ($students->count() < 9) {
            $students = $students->merge($students)->take(9);
        }

        $admin    = User::where('role', 'admin')->first();
        $numberer = app(InvoiceNumberer::class);
        $year     = (int) now()->format('Y');
        $created  = 0;

        // ─── 3 × Monthly (automatic) ──────────────────────────────────────────
        $monthlyStatuses = ['sent', 'overdue', 'paid'];
        foreach ($monthlyStatuses as $i => $status) {
            $student     = $students[$i];
            $period      = now()->subMonths($i)->startOfMonth();
            $periodYear  = (int) $period->format('Y');
            $periodMonth = (int) $period->format('n');
            $amount      = $student->monthly_price_minor ?: 50000;
            $discount    = $student->custom_discount_pct > 0
                ? (int) round($amount * $student->custom_discount_pct / 100)
                : 0;
            $total       = max(0, $amount - $discount);
            $issuedAt    = now()->subDays(10 + $i * 5);
            $dueAt       = now()->subDays($i * 15 - 5);
            $paidAt      = $status === 'paid' ? now()->subDays(3) : null;

            $invoice = Invoice::create([
                'student_id'          => $student->id,
                'invoice_number'      => $numberer->next($year),
                'type'                => 'monthly',
                'period_year'         => $periodYear,
                'period_month'        => $periodMonth,
                'currency'            => $student->currency ?? 'EGP',
                'subtotal_minor'      => $amount,
                'discount_minor'      => $discount,
                'wallet_credit_minor' => 0,
                'total_minor'         => $total,
                'status'              => $status,
                'issued_at'           => $issuedAt,
                'due_at'              => $dueAt,
                'paid_at'             => $paidAt,
                'created_by_user_id'  => $admin?->id,
                'snapshot'            => [
                    'student_name'        => $student->name,
                    'course_name'         => $student->course?->name,
                    'monthly_price_minor' => $amount,
                    'sessions_per_month'  => $student->sessions_per_month,
                    'session_duration_min'=> $student->session_duration_min,
                ],
            ]);

            InvoiceLine::create([
                'invoice_id'           => $invoice->id,
                'description'          => 'Monthly tuition – ' . $period->format('F Y'),
                'kind'                 => 'monthly',
                'quantity'             => 1,
                'session_duration_min' => $student->session_duration_min,
                'unit_price_minor'     => $amount,
                'line_total_minor'     => $amount,
                'source_invoice_id'    => null,
            ]);

            if ($discount > 0) {
                InvoiceLine::create([
                    'invoice_id'           => $invoice->id,
                    'description'          => "Sibling discount ({$student->custom_discount_pct}%)",
                    'kind'                 => 'discount',
                    'quantity'             => 1,
                    'session_duration_min' => null,
                    'unit_price_minor'     => -$discount,
                    'line_total_minor'     => -$discount,
                    'source_invoice_id'    => null,
                ]);
            }

            $this->command->line("  [monthly/{$status}] {$invoice->invoice_number} — {$student->name}  /pay/{$invoice->payment_token}");
            $created++;
        }

        // ─── 3 × Advance / Pro-rata ───────────────────────────────────────────
        $advanceStatuses = ['sent', 'overdue', 'paid'];
        foreach ($advanceStatuses as $i => $status) {
            $student     = $students[3 + $i];
            $period      = now()->startOfMonth();
            $periodYear  = (int) $period->format('Y');
            $periodMonth = (int) $period->format('n');
            $fullAmount  = $student->monthly_price_minor ?: 50000;
            $daysInMonth = (int) $period->daysInMonth;
            $remaining   = max(1, $daysInMonth - (int) now()->format('j') + 1);
            $proRata     = (int) round($fullAmount * $remaining / $daysInMonth);
            $dueAt       = now()->addDays(7 - $i * 3);
            $paidAt      = $status === 'paid' ? now()->subDays(1) : null;

            $invoice = Invoice::create([
                'student_id'          => $student->id,
                'invoice_number'      => $numberer->next($year),
                'type'                => 'advance',
                'period_year'         => $periodYear,
                'period_month'        => $periodMonth,
                'currency'            => $student->currency ?? 'EGP',
                'subtotal_minor'      => $proRata,
                'discount_minor'      => 0,
                'wallet_credit_minor' => 0,
                'total_minor'         => $proRata,
                'status'              => $status,
                'issued_at'           => now()->subDays(2),
                'due_at'              => $dueAt,
                'paid_at'             => $paidAt,
                'created_by_user_id'  => $admin?->id,
                'snapshot'            => [
                    'student_name'        => $student->name,
                    'course_name'         => $student->course?->name,
                    'monthly_price_minor' => $fullAmount,
                    'sessions_per_month'  => $student->sessions_per_month,
                    'session_duration_min'=> $student->session_duration_min,
                ],
            ]);

            InvoiceLine::create([
                'invoice_id'           => $invoice->id,
                'description'          => sprintf(
                    'Pro-rata – %s (%d of %d days)',
                    $period->format('F Y'), $remaining, $daysInMonth
                ),
                'kind'                 => 'pro_rata',
                'quantity'             => 1,
                'session_duration_min' => $student->session_duration_min,
                'unit_price_minor'     => $proRata,
                'line_total_minor'     => $proRata,
                'source_invoice_id'    => null,
            ]);

            $this->command->line("  [advance/{$status}] {$invoice->invoice_number} — {$student->name}  /pay/{$invoice->payment_token}");
            $created++;
        }

        // ─── 3 × Manual ───────────────────────────────────────────────────────
        $manualDefs = [
            ['desc' => 'Extra session — make-up class',   'amount' => 15000, 'status' => 'sent'],
            ['desc' => 'Materials & workbook fee',        'amount' => 8000,  'status' => 'overdue'],
            ['desc' => 'Registration & onboarding fee',   'amount' => 25000, 'status' => 'paid'],
        ];
        foreach ($manualDefs as $i => $def) {
            $student = $students[6 + $i];
            $amount  = $def['amount'];
            $status  = $def['status'];
            $dueAt   = now()->subDays($i * 10);
            $paidAt  = $status === 'paid' ? now()->subDays(2) : null;

            $invoice = Invoice::create([
                'student_id'          => $student->id,
                'invoice_number'      => $numberer->next($year),
                'type'                => 'manual',
                'period_year'         => null,
                'period_month'        => null,
                'currency'            => $student->currency ?? 'EGP',
                'subtotal_minor'      => $amount,
                'discount_minor'      => 0,
                'wallet_credit_minor' => 0,
                'total_minor'         => $amount,
                'status'              => $status,
                'issued_at'           => now()->subDays(3 + $i * 2),
                'due_at'              => $dueAt,
                'paid_at'             => $paidAt,
                'created_by_user_id'  => $admin?->id,
                'snapshot'            => [
                    'student_name' => $student->name,
                    'course_name'  => $student->course?->name,
                    'description'  => $def['desc'],
                ],
            ]);

            InvoiceLine::create([
                'invoice_id'           => $invoice->id,
                'description'          => $def['desc'],
                'kind'                 => 'adjustment',
                'quantity'             => 1,
                'session_duration_min' => null,
                'unit_price_minor'     => $amount,
                'line_total_minor'     => $amount,
                'source_invoice_id'    => null,
            ]);

            $this->command->line("  [manual/{$status}] {$invoice->invoice_number} — {$student->name}  /pay/{$invoice->payment_token}");
            $created++;
        }

        $this->command->info("TestInvoiceSeeder: {$created} test invoices created.");
        $this->command->newLine();
        $this->command->warn('Tip: copy a /pay/<token> link above and open it to test XPay.');
    }
}
