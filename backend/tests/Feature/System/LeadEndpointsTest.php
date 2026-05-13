<?php

namespace Tests\Feature\System;

use App\Models\System\Lead;
use App\Models\System\LeadFollowUp;
use Tests\SystemTestCase;

class LeadEndpointsTest extends SystemTestCase
{
    public function test_admin_can_list_leads(): void
    {
        Lead::factory()->count(3)->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/leads')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_list_filters_by_status(): void
    {
        Lead::factory()->new()->count(2)->create();
        Lead::factory()->contacted()->create();

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/leads?filter[status]=new')
            ->assertOk();

        $this->assertCount(2, $response->json('data'));
        $this->assertSame('new', $response->json('data.0.status'));
    }

    public function test_admin_can_create_lead(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/leads', [
                'name'   => 'Sara Ahmed',
                'email'  => 'sara@example.com',
                'phone'  => '+201001234567',
                'source' => 'website_form',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Sara Ahmed')
            ->assertJsonPath('data.status', 'new');

        $this->assertDatabaseHas('sys_leads', [
            'email'  => 'sara@example.com',
            'status' => 'new',
        ]);
    }

    public function test_admin_can_view_single_lead(): void
    {
        $lead = Lead::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/leads/{$lead->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $lead->id);
    }

    public function test_admin_can_update_lead(): void
    {
        $lead = Lead::factory()->new()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/leads/{$lead->id}", [
                'status' => 'contacted',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'contacted');
    }

    public function test_admin_can_delete_lead(): void
    {
        $lead = Lead::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->deleteJson("/api/system/leads/{$lead->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Lead deleted.');

        $this->assertSoftDeleted('sys_leads', ['id' => $lead->id]);
    }

    public function test_admin_can_list_lead_follow_ups(): void
    {
        $lead = Lead::factory()->create();
        LeadFollowUp::factory()->count(2)->create([
            'lead_id'       => $lead->id,
            'actor_user_id' => $this->adminUser()->id,
        ]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/leads/{$lead->id}/follow-ups")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_admin_can_add_follow_up_to_lead(): void
    {
        $lead = Lead::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/leads/{$lead->id}/follow-ups", [
                'due_at' => now()->addDay()->toDateTimeString(),
                'action' => 'Call back',
                'notes'  => 'Discuss pricing options',
            ])
            ->assertCreated()
            ->assertJsonPath('data.action', 'Call back');

        $this->assertDatabaseHas('sys_lead_follow_ups', [
            'lead_id' => $lead->id,
            'action'  => 'Call back',
        ]);
    }

    public function test_teacher_cannot_list_leads(): void
    {
        ['user' => $teacherUser] = $this->teacherUser();

        $this->actingAs($teacherUser, 'sanctum')
            ->getJson('/api/system/leads')
            ->assertForbidden();
    }

    public function test_teacher_cannot_create_lead(): void
    {
        ['user' => $teacherUser] = $this->teacherUser();

        $this->actingAs($teacherUser, 'sanctum')
            ->postJson('/api/system/leads', [
                'name'   => 'Test Lead',
                'source' => 'manual_entry',
            ])
            ->assertForbidden();
    }
}
