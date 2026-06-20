<?php

namespace Tests\Feature\System;

use App\Models\System\Student;
use App\Models\System\Teacher;
use Illuminate\Support\Facades\Notification;
use Tests\SystemTestCase;

class TeacherEndpointsTest extends SystemTestCase
{
    public function test_admin_can_list_teachers(): void
    {
        Teacher::factory()->count(3)->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/teachers')
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'last_page', 'total'],
            ]);
    }

    public function test_admin_can_view_teacher(): void
    {
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/teachers/{$teacher->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $teacher->id);
    }

    public function test_admin_can_create_teacher(): void
    {
        Notification::fake();

        $payload = [
            'name'                => 'Nour Hassan',
            'email'               => 'nour.hassan@example.com',
            'payment_method'      => 'instapay',
            'hourly_rate'         => 300,
        ];

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/teachers', $payload)
            ->assertSuccessful()
            ->assertJsonPath('data.name', 'Nour Hassan')
            ->assertJsonPath('data.email', 'nour.hassan@example.com');

        $this->assertDatabaseHas('users', ['email' => 'nour.hassan@example.com', 'role' => 'teacher']);
        // Controller derives the per-minute rate from the hourly rate (300 / 60 = 5).
        $this->assertDatabaseHas('sys_teachers', ['per_minute_rate_30' => 5]);
    }

    public function test_admin_can_deactivate_teacher(): void
    {
        $teacher = Teacher::factory()->create(['is_active' => true]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/teachers/{$teacher->id}/deactivate")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('sys_teachers', ['id' => $teacher->id, 'is_active' => false]);
    }

    public function test_deactivate_fails_when_teacher_has_assigned_students(): void
    {
        ['teacher' => $teacher] = $this->teacherUser();

        Student::factory()->create(['assigned_teacher_id' => $teacher->id]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/teachers/{$teacher->id}/deactivate")
            ->assertStatus(422);
    }

    public function test_admin_can_activate_teacher(): void
    {
        $teacher = Teacher::factory()->inactive()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/teachers/{$teacher->id}/activate")
            ->assertOk()
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('sys_teachers', ['id' => $teacher->id, 'is_active' => true]);
    }

    public function test_teacher_user_can_view_own_profile(): void
    {
        ['user' => $teacherUser, 'teacher' => $teacher] = $this->teacherUser();

        $this->actingAs($teacherUser, 'sanctum')
            ->getJson("/api/system/teachers/{$teacher->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $teacher->id);
    }
}
