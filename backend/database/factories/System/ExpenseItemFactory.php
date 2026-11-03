<?php

namespace Database\Factories\System;

use App\Models\System\ExpenseCategory;
use App\Models\System\ExpenseItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExpenseItemFactory extends Factory
{
    protected $model = ExpenseItem::class;

    public function definition(): array
    {
        return [
            'name'                 => $this->faker->unique()->words(2, true),
            'category_id'          => ExpenseCategory::factory(),
            'type'                 => ExpenseItem::FIXED,
            'default_amount_minor' => 50_000,
            'currency'             => 'USD',
            'is_active'            => true,
        ];
    }

    public function variable(): static
    {
        return $this->state(['type' => ExpenseItem::VARIABLE, 'default_amount_minor' => null]);
    }
}
