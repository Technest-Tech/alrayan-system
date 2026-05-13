<?php

namespace Tests\Feature\System;

use App\Models\System\Payroll;
use App\Models\System\Teacher;
use Tests\SystemTestCase;

class PayrollEndpointsTest extends SystemTestCase
{
    public function test_admin_can_list_payrolls(): void
    {
        Payroll::factory()->count(3)->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/payrolls')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_list_filters_by_status(): void
    {
        Payroll::factory()->pending()->count(2)->create();
        Payroll::factory()->approved()->create();

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/payrolls?filter[status]=pending')
            ->assertOk();

        $this->assertCount(2, $response->json('data'));
        $this->assertSame('pending', $response->json('data.0.status'));
    }

    public function test_list_filters_by_teacher_id(): void
    {
        $teacherA = Teacher::factory()->create();
        $teacherB = Teacher::factory()->create();

        Payroll::factory()->create(['teacher_id' => $teacherA->id, 'period_month' => 1]);
        Payroll::factory()->create(['teacher_id' => $teacherA->id, 'period_month' => 2]);
        Payroll::factory()->create(['teacher_id' => $teacherB->id, 'period_month' => 1]);

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/payrolls?filter[teacher_id]={$teacherA->id}")
            ->assertOk();

        $this->assertCount(2, $response->json('data'));
    }

    public function test_admin_can_view_single_payroll(): void
    {
        $payroll = Payroll::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/payrolls/{$payroll->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $payroll->id);
    }

    public function test_admin_can_approve_pending_payroll(): void
    {
        $payroll = Payroll::factory()->pending()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/payrolls/{$payroll->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('sys_payrolls', [
            'id'     => $payroll->id,
            'status' => 'approved',
        ]);
    }

    public function test_admin_can_mark_payroll_as_transferred(): void
    {
        $payroll = Payroll::factory()->approved()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/payrolls/{$payroll->id}/mark-transferred", [
                'transfer_reference' => 'VC-202605-0001',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'transferred');

        $this->assertDatabaseHas('sys_payrolls', [
            'id'                 => $payroll->id,
            'status'             => 'transferred',
            'transfer_reference' => 'VC-202605-0001',
        ]);
    }

    public function test_inactive_user_cannot_access_payroll_list(): void
    {
        $user = \App\Models\User::factory()->create([
            'role'      => 'supervisor',
            'is_active' => false,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/payrolls')
            ->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/system/payrolls')->assertUnauthorized();
    }
}
