<?php

namespace Database\Factories\System;

use App\Models\System\ExpenseCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ExpenseCategoryFactory extends Factory
{
    protected $model = ExpenseCategory::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(2, true);
        return [
            'name'       => ucwords($name),
            'slug'       => Str::slug($name),
            'is_default' => false,
            'is_active'  => true,
        ];
    }
}
