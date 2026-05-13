<?php

namespace Database\Factories\System;

use App\Models\System\Expense;
use App\Models\System\ExpenseCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExpenseFactory extends Factory
{
    protected $model = Expense::class;

    public function definition(): array
    {
        return [
            'category_id'       => ExpenseCategory::factory(),
            'amount_minor'      => $this->faker->numberBetween(1000, 500_000),
            'currency'          => $this->faker->randomElement(['EGP', 'USD']),
            'description'       => $this->faker->sentence(4),
            'occurred_on'       => $this->faker->dateTimeBetween('-60 days', 'now')->format('Y-m-d'),
            'created_by_user_id'=> null,
            'attachments'       => null,
        ];
    }
}
