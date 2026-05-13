<?php

namespace Database\Factories\System;

use App\Models\System\Certificate;
use App\Models\System\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

class CertificateFactory extends Factory
{
    protected $model = Certificate::class;

    public function definition(): array
    {
        $year = now()->year;
        static $counter = 0;
        $counter++;

        return [
            'certificate_number' => sprintf('CRT-%d-%05d', $year, $counter),
            'student_id'         => Student::factory(),
            'course_id'          => null,
            'teacher_id'         => null,
            'type'               => $this->faker->randomElement(['course_completion', 'hifz_milestone', 'ijazah', 'other']),
            'title'              => $this->faker->sentence(4),
            'description'        => $this->faker->paragraph(),
            'issued_on'          => $this->faker->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'pdf_path'           => null,
            'issued_by_user_id'  => null,
        ];
    }
}
