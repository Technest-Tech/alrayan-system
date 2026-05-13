<?php

namespace Database\Factories\System;

use App\Models\System\Invoice;
use App\Models\System\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'invoice_id'   => Invoice::factory(),
            'amount_minor' => 2500,
            'currency'     => 'USD',
            'method'       => 'bank_transfer',
            'reference'    => $this->faker->uuid(),
            'paid_at'      => now(),
        ];
    }

    public function paymob(): static
    {
        return $this->state([
            'method'                => 'paymob',
            'paymob_transaction_id' => (string) $this->faker->unique()->randomNumber(8),
        ]);
    }

    public function manual(): static
    {
        return $this->state(['method' => 'bank_transfer']);
    }
}
