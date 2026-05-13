<?php

namespace Database\Factories\System;

use App\Models\System\SchedulePattern;
use App\Models\System\Student;
use App\Models\System\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

class SchedulePatternFactory extends Factory
{
    protected $model = SchedulePattern::class;

    public function definition(): array
    {
        $durations = [30, 45, 60];

        return [
            'student_id'   => Student::factory(),
            'teacher_id'   => Teacher::factory(),
            'day_of_week'  => $this->faker->numberBetween(0, 6),
            'start_time'   => $this->faker->randomElement(['15:00', '16:00', '17:00', '18:00', '19:00', '20:00']),
            'duration_min' => $this->faker->randomElement($durations),
            'timezone'     => $this->faker->randomElement(['Africa/Cairo', 'America/New_York', 'Europe/London', 'Asia/Riyadh']),
            'valid_from'   => now()->toDateString(),
            'valid_to'     => null,
        ];
    }

    public function forStudent(Student $student): static
    {
        return $this->state(['student_id' => $student->id, 'teacher_id' => $student->assigned_teacher_id, 'timezone' => $student->timezone]);
    }

    public function closed(): static
    {
        return $this->state(['valid_to' => now()->subDay()->toDateString()]);
    }
}
