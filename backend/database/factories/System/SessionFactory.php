<?php

namespace Database\Factories\System;

use App\Models\System\Session;
use App\Models\System\SchedulePattern;
use App\Models\System\Student;
use App\Models\System\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

class SessionFactory extends Factory
{
    protected $model = Session::class;

    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('-30 days', '+14 days');
        $duration = $this->faker->randomElement([30, 45, 60]);

        return [
            'student_id'          => Student::factory(),
            'teacher_id'          => Teacher::factory(),
            'schedule_pattern_id' => null,
            'original_session_id' => null,
            'scheduled_start'     => $start,
            'scheduled_end'       => (clone $start)->modify("+{$duration} minutes"),
            'duration_min'        => $duration,
            'status'              => 'scheduled',
            'cancelled_by'        => null,
            'cancellation_reason' => null,
            'zoom_meeting_id'     => 'fake-' . $this->faker->numerify('##########'),
            'zoom_join_url'       => 'https://zoom.us/j/' . $this->faker->numerify('##########'),
            'zoom_start_url'      => 'https://zoom.us/s/' . $this->faker->numerify('##########') . '?zak=' . $this->faker->sha256(),
        ];
    }

    public function attended(): static
    {
        return $this->state([
            'status'               => 'attended',
            'attended_marked_at'   => now(),
            'scheduled_start'      => $this->faker->dateTimeBetween('-90 days', '-1 day'),
        ]);
    }

    public function absent(): static
    {
        return $this->state([
            'status'          => 'absent',
            'scheduled_start' => $this->faker->dateTimeBetween('-90 days', '-1 day'),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state([
            'status'       => 'cancelled',
            'cancelled_by' => $this->faker->randomElement(['student', 'teacher', 'admin']),
            'scheduled_start' => $this->faker->dateTimeBetween('-90 days', '-1 day'),
        ]);
    }

    public function pendingSubstitute(): static
    {
        return $this->state(['status' => 'pending_substitute']);
    }

    public function upcoming(): static
    {
        return $this->state([
            'status'          => 'scheduled',
            'scheduled_start' => $this->faker->dateTimeBetween('+1 day', '+14 days'),
        ]);
    }
}
