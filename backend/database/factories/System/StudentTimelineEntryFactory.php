<?php

namespace Database\Factories\System;

use App\Models\System\Student;
use App\Models\System\StudentTimelineEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentTimelineEntryFactory extends Factory
{
    protected $model = StudentTimelineEntry::class;

    public function definition(): array
    {
        return [
            'student_id'    => Student::factory(),
            'actor_user_id' => null,
            'event_type'    => 'created',
            'payload'       => ['source' => 'manual'],
        ];
    }
}
