<?php

namespace Tests\Feature\System;

use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use Tests\SystemTestCase;

/**
 * The teacher dashboard and the admin dashboard both have to count the lessons
 * the calendar actually writes (`sys_lessons`). These tests pin that down — they
 * fail if either surface goes back to reading the retired `sys_sessions` table.
 */
class TeacherDashboardStatsTest extends SystemTestCase
{
    private function lessonFor(Teacher $teacher, string $at, int $minutes, string $status = 'attended'): Lesson
    {
        $student = Student::factory()->create([
            'assigned_teacher_id' => $teacher->id,
            'status'              => 'active',
            'currency'            => 'USD',
        ]);

        $package = StudentPackage::create([
            'student_id'     => $student->id,
            'package_number' => 1,
            'package_hours'  => 8,
            'tariff_at_time' => 40000,
            'currency'       => 'USD',
            'status'         => 'paid',
            'paid_at'        => now(),
        ]);

        return Lesson::create([
            'package_id'       => $package->id,
            'teacher_id'       => $teacher->id,
            'student_id'       => $student->id,
            'status'           => $status,
            'scheduled_at'     => $at,
            'duration_minutes' => $minutes,
        ]);
    }

    public function test_teacher_sees_own_hours_and_earnings_from_lessons(): void
    {
        ['user' => $user, 'teacher' => $teacher] = $this->teacherUser();
        $teacher->update([
            'per_minute_rate_30' => 10,
            'per_minute_rate_45' => 10,
            'per_minute_rate_60' => 10,
            'currency'           => 'EUR',
        ]);

        $month = now()->startOfMonth();
        $this->lessonFor($teacher, $month->copy()->addDays(2)->setTime(10, 0)->toDateTimeString(), 60);
        $this->lessonFor($teacher, $month->copy()->addDays(3)->setTime(10, 0)->toDateTimeString(), 30);
        // A trial pays nobody and must not inflate the teacher's hours.
        $this->lessonFor($teacher, $month->copy()->addDays(4)->setTime(10, 0)->toDateTimeString(), 60, 'trial');

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/system/teachers/{$teacher->id}/profile-stats")
            ->assertOk()
            ->assertJsonPath('hours_this_month', 1.5)
            // 1.5h sits on the 0–35h tier → 1.5 × $2.50 = $3.75
            ->assertJsonPath('revenue_minor', 375)
            ->assertJsonPath('currency', 'USD')
            ->assertJsonPath('total_students', 3);
    }

    public function test_teacher_cannot_read_another_teachers_stats(): void
    {
        ['user' => $user] = $this->teacherUser();
        $other = Teacher::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/system/teachers/{$other->id}/profile-stats")
            ->assertForbidden();
    }

    public function test_admin_dashboard_counts_lessons_students_and_package_revenue(): void
    {
        $teacher = Teacher::factory()->create();
        $this->lessonFor($teacher, now()->startOfMonth()->addDay()->setTime(9, 0)->toDateTimeString(), 120);

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/dashboard')
            ->assertOk()
            ->assertJsonPath('kpis.hours_month', 2)
            ->assertJsonPath('kpis.hours_total', 2)
            ->assertJsonPath('kpis.total_students', 1)
            ->assertJsonPath('kpis.active_students', 1);

        // Revenue is the paid package value, reported under its own currency.
        $this->assertSame(40000, $response->json('kpis.month_revenue.USD'));
        $this->assertGreaterThan(0, $response->json('kpis.total_users'));
    }
}
