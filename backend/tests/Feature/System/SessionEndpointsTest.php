<?php

namespace Tests\Feature\System;

use App\Models\System\Session;
use App\Models\System\Student;
use App\Models\System\Teacher;
use Illuminate\Support\Facades\Queue;
use Tests\SystemTestCase;

class SessionEndpointsTest extends SystemTestCase
{
    public function test_admin_can_list_sessions(): void
    {
        Session::factory()->count(3)->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/sessions')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_list_filters_by_teacher_id(): void
    {
        $teacherA = Teacher::factory()->create();
        $teacherB = Teacher::factory()->create();

        Session::factory()->create(['teacher_id' => $teacherA->id]);
        Session::factory()->create(['teacher_id' => $teacherA->id]);
        Session::factory()->create(['teacher_id' => $teacherB->id]);

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/sessions?teacher_id={$teacherA->id}")
            ->assertOk();

        $this->assertCount(2, $response->json('data'));
    }

    public function test_list_filters_by_status(): void
    {
        Session::factory()->create(['status' => 'scheduled']);
        Session::factory()->attended()->create();
        Session::factory()->attended()->create();

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/sessions?status=attended')
            ->assertOk();

        $this->assertCount(2, $response->json('data'));
        $this->assertSame('attended', $response->json('data.0.status'));
    }

    public function test_admin_can_view_single_session(): void
    {
        $session = Session::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/sessions/{$session->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $session->id);
    }

    public function test_admin_can_create_session(): void
    {
        Queue::fake();

        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/sessions', [
                'student_id'      => $student->id,
                'teacher_id'      => $teacher->id,
                'scheduled_start' => now()->addDay()->toDateTimeString(),
                'duration_min'    => 30,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'scheduled')
            ->assertJsonPath('data.student_id', $student->id)
            ->assertJsonPath('data.teacher_id', $teacher->id);

        $this->assertDatabaseHas('sys_sessions', [
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'status'     => 'scheduled',
        ]);
    }

    public function test_create_session_validates_duration(): void
    {
        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/sessions', [
                'student_id'      => $student->id,
                'teacher_id'      => $teacher->id,
                'scheduled_start' => now()->addDay()->toDateTimeString(),
                'duration_min'    => 25,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['duration_min']);
    }

    public function test_admin_can_cancel_session(): void
    {
        Queue::fake();

        $session = Session::factory()->upcoming()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/sessions/{$session->id}/cancel", [
                'cancelled_by'        => 'admin',
                'cancellation_reason' => 'Test cancellation',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_teacher_cannot_list_sessions_without_permission(): void
    {
        ['user' => $teacherUser] = $this->teacherUser();

        $this->actingAs($teacherUser, 'sanctum')
            ->getJson('/api/system/sessions')
            ->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/system/sessions')->assertUnauthorized();
    }
}
