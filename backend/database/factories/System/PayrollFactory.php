<?php

namespace Database\Factories\System;

use App\Models\System\Payroll;
use App\Models\System\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

class PayrollFactory extends Factory
{
    protected $model = Payroll::class;

    public function definition(): array
    {
        $base = $this->faker->numberBetween(500000, 2000000);
        return [
            'teacher_id'            => Teacher::factory(),
            'period_year'           => 2026,
            'period_month'          => $this->faker->numberBetween(1, 12),
            'total_sessions'        => $this->faker->numberBetween(10, 60),
            'total_minutes'         => $this->faker->numberBetween(300, 3600),
            'breakdown_by_duration' => ['30' => 300, '45' => 225, '60' => 600],
            'base_salary_minor'     => $base,
            'bonuses_minor'         => 0,
            'deductions_minor'      => 0,
            'net_salary_minor'      => $base,
            'status'                => 'pending',
            'snapshot'              => ['30' => 200, '45' => 200, '60' => 200],
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => 'pending']);
    }

    public function approved(): static
    {
        return $this->state(['status' => 'approved', 'approved_at' => now()]);
    }

    public function transferred(): static
    {
        return $this->state([
            'status'             => 'transferred',
            'approved_at'        => now(),
            'transferred_at'     => now(),
            'transfer_reference' => 'VC-' . now()->format('Ym') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
        ]);
    }
}
