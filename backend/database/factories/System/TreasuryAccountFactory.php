<?php

namespace Database\Factories\System;

use App\Models\System\TreasuryAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

class TreasuryAccountFactory extends Factory
{
    protected $model = TreasuryAccount::class;

    public function definition(): array
    {
        return [
            'name'                  => $this->faker->unique()->company(),
            'type'                  => 'bank',
            'currency'              => 'USD',
            'opening_balance_minor' => 100_000,
            'opening_date'          => '2026-01-01',
            'is_active'             => true,
        ];
    }
}
