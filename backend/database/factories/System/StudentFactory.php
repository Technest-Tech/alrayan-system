<?php

namespace Database\Factories\System;

use App\Models\System\Guardian;
use App\Models\System\Student;
use App\Models\System\UserEmail;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'name'                 => $this->faker->name(),
            'email'                => $this->faker->unique()->safeEmail(),
            'whatsapp'             => '+1' . $this->faker->numerify('##########'),
            'country'              => $this->faker->randomElement(['US', 'GB', 'CA', 'EG', 'SA', 'AE']),
            'timezone'             => $this->faker->randomElement(['America/New_York', 'Europe/London', 'Africa/Cairo', 'Asia/Riyadh']),
            'student_type'         => 'adult',
            'sessions_per_month'   => 8,
            'session_duration_min' => 30,
            'currency'             => 'USD',
            'monthly_price_minor'  => 2500,
            'custom_discount_pct'  => 0,
            'status'               => 'active',
            'source'               => 'manual',
        ];
    }

    public function trial(): static
    {
        return $this->state(['status' => 'trial']);
    }

    public function paused(): static
    {
        return $this->state(['status' => 'paused', 'paused_at' => now()]);
    }

    public function suspended(): static
    {
        return $this->state(['status' => 'suspended', 'suspended_at' => now()]);
    }

    public function cancelled(): static
    {
        return $this->state([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => 'Personal',
        ]);
    }

    /**
     * A child student linked to a (newly created) guardian.
     */
    public function child(): static
    {
        return $this->state(fn () => [
            'student_type' => 'child',
            'guardian_id'  => Guardian::factory(),
        ]);
    }

    /**
     * Create and link a real student `users` row (role=student), mirroring the
     * unified identity model.
     */
    public function withUser(): static
    {
        return $this->afterCreating(function (Student $student) {
            if ($student->user_id) {
                return;
            }

            $email = $student->email ?: $this->faker->unique()->safeEmail();

            $user = User::factory()->student()->create([
                'name'      => $student->name,
                'email'     => $email,
                'whatsapp'  => $student->whatsapp,
                'status'    => User::STUDENT_STATUS_MAP[$student->status] ?? 'active',
            ]);

            UserEmail::create(['user_id' => $user->id, 'email' => $email, 'is_primary' => true]);

            $student->forceFill(['user_id' => $user->id])->saveQuietly();
        });
    }
}
