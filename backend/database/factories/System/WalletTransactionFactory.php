<?php

namespace Database\Factories\System;

use App\Models\System\Student;
use App\Models\System\WalletTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;

class WalletTransactionFactory extends Factory
{
    protected $model = WalletTransaction::class;

    public function definition(): array
    {
        return [
            'student_id'          => Student::factory(),
            'amount_minor'        => 500,
            'currency'            => 'USD',
            'source'              => 'manual_credit',
            'note'                => 'Test credit',
            'balance_after_minor' => 500,
        ];
    }

    public function credit(): static
    {
        return $this->state([
            'source'       => 'manual_credit',
            'amount_minor' => abs($this->faker->numberBetween(100, 5000)),
        ]);
    }

    public function debit(): static
    {
        return $this->state([
            'source'       => 'manual_debit',
            'amount_minor' => -abs($this->faker->numberBetween(100, 5000)),
        ]);
    }
}
