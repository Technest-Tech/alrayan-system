<?php

namespace Database\Factories\System;

use App\Models\System\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'type'          => 'manual_task',
            'status'        => 'new',
            'priority'      => 'medium',
            'title'         => $this->faker->sentence(3),
            'body'          => $this->faker->optional()->sentence(),
            'assignee_role' => 'supervisor',
            'payload'       => null,
        ];
    }

    public function type(string $type): static
    {
        return $this->state(['type' => $type]);
    }

    public function status(string $status): static
    {
        return $this->state(['status' => $status]);
    }

    public function lateLessonDeduction(int $amountMinor = 60): static
    {
        return $this->state([
            'type'          => 'late_lesson_deduction',
            'priority'      => 'high',
            'assignee_role' => 'accountant',
            'payload'       => ['amount_minor' => $amountMinor],
        ]);
    }

    public function absentPaidApproval(?int $lessonId = null): static
    {
        return $this->state([
            'type'          => 'absent_paid_approval',
            'priority'      => 'high',
            'assignee_role' => 'supervisor',
            'payload'       => ['lesson_id' => $lessonId],
        ]);
    }
}
