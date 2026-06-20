<?php

namespace Tests\Feature\System;

use App\Models\System\Student;
use Tests\SystemTestCase;

class StudentEndpointsTest extends SystemTestCase
{
    public function test_admin_can_list_students(): void
    {
        Student::factory()->count(3)->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/students')
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'last_page', 'total'],
            ]);
    }

    public function test_list_supports_status_filter(): void
    {
        Student::factory()->create(['status' => 'active']);
        Student::factory()->trial()->count(2)->create();

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/students?filter[status]=trial')
            ->assertOk();

        $data = $response->json('data');
        $this->assertCount(2, $data);
        $this->assertSame('trial', $data[0]['status']);
    }

    public function test_list_supports_search_filter(): void
    {
        Student::factory()->create(['name' => 'Fatima Al-Rashid', 'status' => 'active']);
        Student::factory()->create(['name' => 'John Smith', 'status' => 'active']);

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/students?filter[q]=Fatima')
            ->assertOk();

        $names = collect($response->json('data'))->pluck('name');
        $this->assertTrue($names->contains('Fatima Al-Rashid'));
        $this->assertFalse($names->contains('John Smith'));
    }

    public function test_admin_can_create_student(): void
    {
        $payload = [
            'name'                => 'Test Student',
            'phone'               => '+15550001111',
            'country'             => 'US',
            'timezone'            => 'America/New_York',
            'student_type'        => 'adult',
            'sessions_per_month'  => 8,
            'session_duration_min'=> 30,
            'currency'            => 'USD',
            'monthly_price_minor' => 2500,
        ];

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/students', $payload)
            ->assertSuccessful()
            ->assertJsonPath('data.name', 'Test Student')
            ->assertJsonPath('data.status', 'trial');
    }

    public function test_create_student_validates_required_fields(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/students', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'country', 'timezone', 'student_type']);
    }

    public function test_admin_can_view_student(): void
    {
        $student = Student::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/students/{$student->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $student->id);
    }

    public function test_admin_can_update_student(): void
    {
        $student = Student::factory()->create(['name' => 'Original Name']);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/students/{$student->id}", ['name' => 'Updated Name'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Name');
    }

    public function test_teacher_user_cannot_list_all_students(): void
    {
        Student::factory()->count(2)->create();

        ['user' => $teacherUser, 'teacher' => $teacher] = $this->teacherUser();

        $student = Student::factory()->create(['assigned_teacher_id' => $teacher->id]);

        $response = $this->actingAs($teacherUser, 'sanctum')
            ->getJson('/api/system/students');

        $response->assertForbidden();
    }

    public function test_unauthenticated_cannot_access_students(): void
    {
        $this->getJson('/api/system/students')
            ->assertUnauthorized();
    }
}
