<?php

namespace Database\Factories\System;

use App\Models\System\Invoice;
use App\Models\System\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $subtotal = $this->faker->numberBetween(2000, 8000);
        return [
            'student_id'          => Student::factory(),
            'invoice_number'      => 'INV-' . now()->year . '-' . str_pad($this->faker->unique()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'type'                => 'monthly',
            'period_year'         => now()->year,
            'period_month'        => now()->month,
            'currency'            => 'USD',
            'subtotal_minor'      => $subtotal,
            'discount_minor'      => 0,
            'wallet_credit_minor' => 0,
            'total_minor'         => $subtotal,
            'status'              => 'sent',
            'issued_at'           => now(),
            'due_at'              => now()->addDays(3),
        ];
    }

    public function monthly(): static
    {
        return $this->state(['type' => 'monthly']);
    }

    public function advance(): static
    {
        return $this->state(['type' => 'advance']);
    }

    public function paid(): static
    {
        return $this->state(['status' => 'paid', 'paid_at' => now()]);
    }

    public function overdue(): static
    {
        return $this->state(['status' => 'overdue', 'due_at' => now()->subDays(5)]);
    }

    public function void(): static
    {
        return $this->state(['status' => 'void', 'voided_at' => now(), 'voided_reason' => 'Test void']);
    }
}
