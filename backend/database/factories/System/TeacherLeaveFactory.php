<?php

namespace Database\Factories\System;

use App\Models\System\Teacher;
use App\Models\System\TeacherLeave;
use Illuminate\Database\Eloquent\Factories\Factory;

class TeacherLeaveFactory extends Factory
{
    protected $model = TeacherLeave::class;

    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('now', '+2 weeks');
        return [
            'teacher_id'  => Teacher::factory(),
            'start_date'  => $start,
            'end_date'    => (clone $start)->modify('+3 days'),
            'reason'      => $this->faker->sentence(6),
            'status'      => 'pending',
        ];
    }

    public function approved(): static
    {
        return $this->state(['status' => 'approved']);
    }
}
