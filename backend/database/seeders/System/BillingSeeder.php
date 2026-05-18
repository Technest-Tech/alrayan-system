<?php

namespace Database\Seeders\System;

use App\Models\System\Invoice;
use App\Models\System\InvoiceLine;
use App\Models\System\Payment;
use App\Models\System\Student;
use App\Models\User;
use App\Services\System\InvoiceNumberer;
use Illuminate\Database\Seeder;

class BillingSeeder extends Seeder
{
    public function run(): void
    {
        if (Invoice::exists()) {
            $this->command->warn('BillingSeeder: invoices already exist — skipping.');
            return;
        }

        $students = Student::whereIn('status', ['active', 'paused', 'suspended'])->get();

        if ($students->isEmpty()) {
            $this->command->warn('BillingSeeder: no students found — run SystemDemoSeeder first.');
            return;
        }

        $admin = User::where('role', 'admin')->first();
        $numberer = app(InvoiceNumberer::class);

        $invoiceCount = 0;
        $paymentCount = 0;

        foreach ($students as $index => $student) {
            // Decide how many months of history to generate (2–4 months)
            $historyMonths = match ($index % 4) {
                0 => 4,
                1 => 3,
                2 => 2,
                default => 3,
            };

            $scenario = $index % 8; // controls the billing outcome pattern per student

            for ($offset = $historyMonths; $offset >= 0; $offset--) {
                $period = now()->subMonths($offset)->startOfMonth();
                $periodYear = (int) $period->format('Y');
                $periodMonth = (int) $period->format('n');

                // Determine status and dates based on scenario and offset
                [$status, $issuedDaysAgo, $dueDaysAgo, $paidDaysAgo] = $this->resolveScenario(
                    $scenario, $offset, $historyMonths
                );

                $issuedAt = $issuedDaysAgo !== null ? now()->subDays($issuedDaysAgo) : null;
                $dueAt    = now()->subDays($dueDaysAgo);
                $paidAt   = ($status === 'paid' && $paidDaysAgo !== null) ? now()->subDays($paidDaysAgo) : null;

                $year = (int) $dueAt->format('Y');

                // Build monthly line: full monthly price
                $monthlyMinor = $student->monthly_price_minor;

                // Advance invoices (first month) get a pro-rata calculation
                $isAdvance = $offset === $historyMonths;
                $type      = $isAdvance ? 'advance' : 'monthly';

                $lineMinor    = $isAdvance ? $this->proRata($monthlyMinor, $period) : $monthlyMinor;
                $discount     = ($student->custom_discount_pct > 0)
                    ? (int) round($lineMinor * $student->custom_discount_pct / 100)
                    : 0;
                $totalMinor   = max(0, $lineMinor - $discount);

                $voided = $status === 'void';

                $invoice = Invoice::create([
                    'student_id'           => $student->id,
                    'invoice_number'       => $numberer->next($year),
                    'type'                 => $type,
                    'period_year'          => $periodYear,
                    'period_month'         => $periodMonth,
                    'currency'             => $student->currency,
                    'subtotal_minor'       => $lineMinor,
                    'discount_minor'       => $discount,
                    'wallet_credit_minor'  => 0,
                    'total_minor'          => $totalMinor,
                    'status'               => $status,
                    'issued_at'            => $issuedAt,
                    'due_at'               => $dueAt,
                    'paid_at'              => $paidAt,
                    'voided_at'            => $voided ? now()->subDays(rand(1, 5)) : null,
                    'voided_reason'        => $voided ? $this->voidReason($index) : null,
                    'created_by_user_id'   => $admin?->id,
                    'snapshot'             => [
                        'course_name'           => $student->course?->name,
                        'monthly_price_minor'   => $monthlyMinor,
                        'sessions_per_month'    => $student->sessions_per_month,
                        'session_duration_min'  => $student->session_duration_min,
                    ],
                ]);

                // Line item
                $lineDesc = $isAdvance
                    ? sprintf(
                        'Pro-rata – %s (partial month)',
                        $period->format('F Y')
                    )
                    : sprintf(
                        'Monthly tuition – %s',
                        $period->format('F Y')
                    );

                InvoiceLine::create([
                    'invoice_id'          => $invoice->id,
                    'description'         => $lineDesc,
                    'kind'                => $isAdvance ? 'pro_rata' : 'monthly',
                    'quantity'            => 1,
                    'session_duration_min'=> $student->session_duration_min,
                    'unit_price_minor'    => $lineMinor,
                    'line_total_minor'    => $lineMinor,
                    'source_invoice_id'   => null,
                ]);

                // Discount line if applicable
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

                $invoiceCount++;

                // Payment record for paid invoices
                if ($status === 'paid' && $paidAt) {
                    Payment::create([
                        'invoice_id'           => $invoice->id,
                        'amount_minor'         => $totalMinor,
                        'currency'             => $student->currency,
                        'method'               => $this->paymentMethod($index),
                        'reference'            => $this->paymentRef($index, $invoice->invoice_number),
                        'paid_at'              => $paidAt,
                        'recorded_by_user_id'  => $admin?->id,
                    ]);
                    $paymentCount++;
                }
            }
        }

        $this->command->info("BillingSeeder: {$invoiceCount} invoices, {$paymentCount} payments seeded.");
    }

    /**
     * Returns [status, issuedDaysAgo|null, dueDaysAgo, paidDaysAgo|null]
     * offset=0 means the most recent/current month; higher offset = further in the past.
     */
    private function resolveScenario(int $scenario, int $offset, int $historyMonths): array
    {
        $isPast    = $offset > 0;
        $isCurrent = $offset === 0;

        // Historical months (not the most recent) are almost always paid
        if ($isPast) {
            return match ($scenario % 3) {
                // Mostly paid history
                0, 1 => ['paid', $offset * 30 + 5, $offset * 30 - 5, $offset * 30 - 10],
                // One voided somewhere in the middle
                default => $offset === (int) ($historyMonths / 2)
                    ? ['void', $offset * 30 + 2, $offset * 30 - 2, null]
                    : ['paid', $offset * 30 + 5, $offset * 30 - 5, $offset * 30 - 10],
            };
        }

        // Current month outcomes by scenario
        return match ($scenario) {
            0       => ['paid',    3, -10, 2],    // already paid this month
            1       => ['sent',    5,  15, null],  // sent, waiting on payment
            2       => ['sent',    2,  20, null],  // sent recently
            3       => ['overdue', 10, 35, null],  // overdue
            4       => ['overdue', 15, 45, null],  // very overdue
            5       => ['draft',   null, 10, null],// draft, not yet sent
            6       => ['paid',    2,  -5, 1],     // paid (due in future, early payer)
            default => ['sent',    3,  12, null],  // default: sent
        };
    }

    private function proRata(int $monthlyMinor, \Carbon\Carbon $period): int
    {
        $daysInMonth   = (int) $period->daysInMonth;
        $dayOfMonth    = max(1, (int) now()->format('j'));
        $remainingDays = max(1, $daysInMonth - $dayOfMonth + 1);
        return (int) round($monthlyMinor * $remainingDays / $daysInMonth);
    }

    private function paymentMethod(int $index): string
    {
        return match ($index % 6) {
            0 => 'bank_transfer',
            1 => 'instapay',
            2 => 'vodafone_cash',
            3 => 'paypal',
            4 => 'wallet',
            default => 'bank_transfer',
        };
    }

    private function paymentRef(int $index, string $invoiceNumber): string
    {
        return match ($index % 3) {
            0 => 'TXN-' . strtoupper(substr(md5($invoiceNumber), 0, 8)),
            1 => 'REF-' . rand(100000, 999999),
            default => '',
        };
    }

    private function voidReason(int $index): string
    {
        $reasons = [
            'Student cancelled subscription',
            'Duplicate invoice created in error',
            'Course changed — new invoice issued',
            'Payment arrangement updated',
        ];
        return $reasons[$index % count($reasons)];
    }
}
