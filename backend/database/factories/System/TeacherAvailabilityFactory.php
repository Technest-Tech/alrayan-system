<?php

namespace Database\Factories\System;

use App\Models\System\Teacher;
use App\Models\System\TeacherAvailability;
use Illuminate\Database\Eloquent\Factories\Factory;

class TeacherAvailabilityFactory extends Factory
{
    protected $model = TeacherAvailability::class;

    public function definition(): array
    {
        return [
            'teacher_id'  => Teacher::factory(),
            'day_of_week' => $this->faker->numberBetween(0, 6),
            'start_time'  => '14:00:00',
            'end_time'    => '22:00:00',
            'timezone'    => 'Africa/Cairo',
        ];
    }
}
