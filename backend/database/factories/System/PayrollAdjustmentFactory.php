<?php

namespace Database\Factories\System;

use App\Models\System\Payroll;
use App\Models\System\PayrollAdjustment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PayrollAdjustmentFactory extends Factory
{
    protected $model = PayrollAdjustment::class;

    public function definition(): array
    {
        $type = $this->faker->randomElement(['bonus', 'deduction']);
        $bonusCategories     = ['performance', 'retention', 'reports_consistency', 'tenure', 'other_bonus'];
        $deductionCategories = ['unauthorized_absence', 'late_report', 'late_arrival', 'quality_issue', 'other_deduction'];
        return [
            'payroll_id'       => Payroll::factory(),
            'type'             => $type,
            'category'         => $this->faker->randomElement($type === 'bonus' ? $bonusCategories : $deductionCategories),
            'amount_minor'     => $this->faker->numberBetween(1000, 50000),
            'reason'           => $this->faker->sentence(),
            'added_by_user_id' => 1,
        ];
    }
}
