<?php

namespace Database\Factories\System;

use App\Models\System\TreasuryAccount;
use App\Models\System\TreasuryTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;

class TreasuryTransactionFactory extends Factory
{
    protected $model = TreasuryTransaction::class;

    public function definition(): array
    {
        return [
            'account_id'   => TreasuryAccount::factory(),
            'direction'    => TreasuryTransaction::IN,
            'kind'         => TreasuryTransaction::KIND_INCOME,
            'amount_minor' => 10_000,
            'occurred_on'  => '2026-02-01',
            'description'  => $this->faker->sentence(3),
        ];
    }
}
