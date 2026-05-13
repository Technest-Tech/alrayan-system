<?php

namespace Database\Factories\System;

use App\Models\System\Session;
use App\Models\System\SessionReport;
use App\Models\System\Student;
use App\Models\System\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

class SessionReportFactory extends Factory
{
    protected $model = SessionReport::class;

    public function definition(): array
    {
        return [
            'session_id'         => Session::factory()->attended(),
            'teacher_id'         => Teacher::factory(),
            'student_id'         => Student::factory(),
            'covered_text'       => $this->faker->paragraph(),
            'performance'        => $this->faker->randomElement(['excellent', 'good', 'needs_improvement']),
            'homework_text'      => $this->faker->optional(0.7)->sentence(),
            'next_session_notes' => $this->faker->optional(0.5)->sentence(),
            'submitted_at'       => now(),
        ];
    }
}
