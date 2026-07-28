<?php

namespace Tests\Feature\System;

use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use Tests\SystemTestCase;

class StudentAnalyticsEndpointsTest extends SystemTestCase
{
    public function test_students_analytics_returns_live_overview_charts_and_records(): void
    {
        $teacher = Teacher::factory()->create(['hourly_rate' => 300, 'currency' => 'USD']);
        $active = Student::factory()->create([
            'name' => 'Active Student',
            'status' => 'active',
            'assigned_teacher_id' => $teacher->id,
            'package_hours_default' => 12,
        ]);
        Student::factory()->paused()->create();
        Student::factory()->cancelled()->create();

        $package = StudentPackage::create([
            'student_id' => $active->id,
            'package_number' => 0,
            'package_hours' => 12,
            'tariff_at_time' => 12000,
            'currency' => 'USD',
            'status' => 'paid',
        ]);
        Lesson::create([
            'package_id' => $package->id,
            'teacher_id' => $teacher->id,
            'student_id' => $active->id,
            'status' => 'attended',
            'scheduled_at' => now(),
            'duration_minutes' => 60,
        ]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/students/analytics?period=all&per_page=20&q=Active%20Student')
            ->assertOk()
            ->assertJsonPath('overview.total_students', 3)
            ->assertJsonPath('overview.active_students', 1)
            ->assertJsonPath('overview.inactive_students', 1)
            ->assertJsonPath('overview.archived_students', 1)
            ->assertJsonPath('overview.total_lessons', 1)
            ->assertJsonPath('records.meta.total', 1)
            ->assertJsonPath('records.data.0.name', 'Active Student')
            ->assertJsonStructure([
                'stopped' => ['currently_stopped', 'monthly', 'reasons'],
                'archived' => ['currently_archived', 'monthly', 'reasons'],
                'charts' => [
                    'status',
                    'currencies',
                    'package_sizes',
                    'activity',
                    'lessons_per_month',
                    'package_utilization',
                    'active_students_per_month',
                    'average_lessons_per_student',
                ],
                'filters' => ['teachers'],
            ]);
    }

    public function test_students_analytics_requires_students_view_permission(): void
    {
        $this->actingAs($this->staffUser('accountant'), 'sanctum')
            ->getJson('/api/system/students/analytics')
            ->assertForbidden();
    }
}
