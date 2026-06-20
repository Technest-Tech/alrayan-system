<?php

namespace Tests\Feature\System;

use App\Models\Course;
use App\Models\System\Lead;
use App\Models\System\LeadFollowUp;
use App\Models\System\Teacher;
use App\Models\User;
use App\Support\System\Permissions\PermissionRegistry;
use Spatie\Permission\Models\Role;
use Tests\SystemTestCase;

class LeadEndpointsTest extends SystemTestCase
{
    /** A non-admin user that still holds every lead permission (e.g. supervisor). */
    private function supervisorUser(): User
    {
        $role = Role::firstOrCreate(['name' => 'supervisor', 'guard_name' => 'web']);
        $role->syncPermissions(array_values(array_filter(
            PermissionRegistry::all(),
            fn ($p) => str_starts_with($p, 'leads.') || str_starts_with($p, 'lead_followups.'),
        )));

        $user = User::factory()->create(['role' => 'supervisor', 'is_active' => true]);
        $user->syncRoles(['supervisor']);

        return $user->fresh();
    }

    private function makeCourse(): Course
    {
        return Course::create([
            'slug'              => 'course-' . uniqid(),
            'title'             => 'Test Course',
            'short_description' => 'Short description.',
            'long_description'  => 'Long description.',
            'icon'              => 'BookOpen',
            'level'             => 'Beginner',
            'features'          => ['Feature 1'],
            'seo_title'         => 'Test SEO Title',
            'seo_description'   => 'Test SEO Description.',
            'outcomes'          => ['Outcome 1'],
            'curriculum'        => [['module' => 'Module 1', 'topics' => ['Topic 1']]],
            'personas'          => [['title' => 'Persona 1', 'description' => 'Desc.']],
            'faqs'              => [['q' => 'Q?', 'a' => 'A.']],
            'related_slugs'     => [],
            'specialty_tags'    => ['Test'],
            'active'            => true,
            'sort_order'        => 0,
        ]);
    }

    // ---------------------------------------------------------------- READ ---

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
        Lead::factory()->newLead()->count(2)->create();
        Lead::factory()->interested()->create();

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/leads?filter[status]=new_lead')
            ->assertOk();

        $this->assertCount(2, $response->json('data'));
        $this->assertSame('new_lead', $response->json('data.0.status'));
    }

    public function test_list_filters_by_platform_and_priority(): void
    {
        Lead::factory()->create(['platform' => 'instagram', 'priority' => 'high']);
        Lead::factory()->create(['platform' => 'facebook', 'priority' => 'low']);

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/leads?filter[platform]=instagram&filter[priority]=high')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('instagram', $response->json('data.0.platform'));
    }

    public function test_list_can_search_by_name(): void
    {
        Lead::factory()->create(['name' => 'Zaynab Distinctive']);
        Lead::factory()->create(['name' => 'Someone Else']);

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/leads?filter[q]=Distinctive')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Zaynab Distinctive', $response->json('data.0.name'));
    }

    public function test_admin_can_view_single_lead(): void
    {
        $lead = Lead::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/leads/{$lead->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $lead->id);
    }

    // -------------------------------------------------------------- CREATE ---

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
            ->assertJsonPath('data.status', 'new_lead');

        $this->assertDatabaseHas('sys_leads', [
            'email'  => 'sara@example.com',
            'status' => 'new_lead',
        ]);
    }

    public function test_create_lead_persists_extended_fields(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/leads', [
                'name'               => 'Family Lead',
                'source'             => 'manual_entry',
                'platform'           => 'instagram',
                'priority'           => 'high',
                'age'                => 12,
                'gender'             => 'male',
                'city'               => 'Cairo',
                'package_hours'      => 8,
                'subscription_price' => 1200.50,
                'currency'           => 'EGP',
                'payment_method'     => 'cash',
                'is_family_lead'     => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.priority', 'high')
            ->assertJsonPath('data.is_family_lead', true);

        $this->assertDatabaseHas('sys_leads', [
            'name'     => 'Family Lead',
            'platform' => 'instagram',
            'city'     => 'Cairo',
        ]);
    }

    public function test_create_lead_validates_required_name(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/leads', ['source' => 'manual_entry'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_lead_rejects_invalid_status(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/leads', [
                'name'   => 'Bad Status',
                'source' => 'manual_entry',
                'status' => 'contacted', // legacy value, no longer valid
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    // -------------------------------------------------------------- UPDATE ---

    public function test_admin_can_update_lead_fields(): void
    {
        $lead = Lead::factory()->newLead()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/leads/{$lead->id}", [
                'name'  => 'Renamed Lead',
                'notes' => 'Called, very interested',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Renamed Lead')
            ->assertJsonPath('data.notes', 'Called, very interested');
    }

    public function test_admin_can_advance_status_through_pipeline(): void
    {
        $lead = Lead::factory()->newLead()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/leads/{$lead->id}", ['status' => 'interested'])
            ->assertOk()
            ->assertJsonPath('data.status', 'interested');

        $this->assertDatabaseHas('sys_leads', ['id' => $lead->id, 'status' => 'interested']);
    }

    public function test_update_rejects_illegal_status_transition(): void
    {
        // new_lead -> waiting_for_payment is not an allowed transition
        $lead = Lead::factory()->newLead()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/leads/{$lead->id}", ['status' => 'waiting_for_payment'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_status_cannot_be_set_to_closed_via_update(): void
    {
        $lead = Lead::factory()->interested()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/leads/{$lead->id}", ['status' => 'closed'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_admin_can_reopen_lost_lead(): void
    {
        $lead = Lead::factory()->lost()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/leads/{$lead->id}", ['status' => 'interested'])
            ->assertOk()
            ->assertJsonPath('data.status', 'interested');
    }

    public function test_non_admin_cannot_reopen_to_earlier_stage(): void
    {
        // supervisor owns the lead (so the update policy passes), but reopening
        // to an earlier pipeline stage is admin-only and must be rejected by the pipeline.
        $supervisor = $this->supervisorUser();
        $lead = Lead::factory()->interested()->create(['assigned_supervisor_id' => $supervisor->id]);

        $this->actingAs($supervisor, 'sanctum')
            ->patchJson("/api/system/leads/{$lead->id}", ['status' => 'new_lead'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    // -------------------------------------------------------------- DELETE ---

    public function test_admin_can_delete_lead(): void
    {
        $lead = Lead::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->deleteJson("/api/system/leads/{$lead->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Lead deleted.');

        $this->assertSoftDeleted('sys_leads', ['id' => $lead->id]);
    }

    // -------------------------------------------------------------- ASSIGN ---

    public function test_admin_can_assign_lead_to_supervisor(): void
    {
        $lead       = Lead::factory()->create();
        $supervisor = $this->supervisorUser();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/leads/{$lead->id}/assign", [
                'supervisor_id' => $supervisor->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.assigned_supervisor_id', $supervisor->id);

        $this->assertDatabaseHas('sys_leads', [
            'id'                     => $lead->id,
            'assigned_supervisor_id' => $supervisor->id,
        ]);
    }

    public function test_admin_can_bulk_assign_leads(): void
    {
        $leads      = Lead::factory()->count(3)->create();
        $supervisor = $this->supervisorUser();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/leads/bulk-assign', [
                'lead_ids'      => $leads->pluck('id')->all(),
                'supervisor_id' => $supervisor->id,
            ])
            ->assertOk()
            ->assertJsonPath('message', '3 leads assigned.');

        foreach ($leads as $lead) {
            $this->assertDatabaseHas('sys_leads', [
                'id'                     => $lead->id,
                'assigned_supervisor_id' => $supervisor->id,
            ]);
        }
    }

    // ------------------------------------------------------------ MARK LOST ---

    public function test_admin_can_mark_lead_as_lost(): void
    {
        $lead = Lead::factory()->interested()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/leads/{$lead->id}/mark-lost", [
                'lost_reason' => 'price',
                'lost_notes'  => 'Too expensive for them',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'lost');

        $this->assertDatabaseHas('sys_leads', [
            'id'          => $lead->id,
            'status'      => 'lost',
            'lost_reason' => 'price',
        ]);
    }

    public function test_mark_lost_requires_reason(): void
    {
        $lead = Lead::factory()->interested()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/leads/{$lead->id}/mark-lost", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['lost_reason']);
    }

    // -------------------------------------------------------------- CONVERT ---

    public function test_admin_can_convert_lead_to_student(): void
    {
        $lead    = Lead::factory()->waitingForPayment()->create();
        $course  = $this->makeCourse();
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/leads/{$lead->id}/convert", [
                'course_id'            => $course->id,
                'assigned_teacher_id'  => $teacher->id,
                'timezone'             => 'Africa/Cairo',
                'student_type'         => 'adult',
                'sessions_per_month'   => 8,
                'session_duration_min' => 60,
                'monthly_price_minor'  => 120000,
                'currency'             => 'EGP',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Lead converted to student.');

        $this->assertDatabaseHas('sys_leads', [
            'id'     => $lead->id,
            'status' => 'closed',
        ]);
        $this->assertDatabaseHas('sys_students', ['lead_id' => $lead->id]);
    }

    public function test_cannot_convert_already_closed_lead(): void
    {
        $lead    = Lead::factory()->closed()->create();
        $course  = $this->makeCourse();
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/leads/{$lead->id}/convert", [
                'course_id'            => $course->id,
                'assigned_teacher_id'  => $teacher->id,
                'timezone'             => 'Africa/Cairo',
                'student_type'         => 'adult',
                'sessions_per_month'   => 8,
                'session_duration_min' => 60,
                'monthly_price_minor'  => 120000,
                'currency'             => 'EGP',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Lead is already converted.');
    }

    // ------------------------------------------------------------ FOLLOW-UPS ---

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

    public function test_follow_up_due_date_must_be_in_future(): void
    {
        $lead = Lead::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/leads/{$lead->id}/follow-ups", [
                'due_at' => now()->subDay()->toDateTimeString(),
                'action' => 'Late call',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['due_at']);
    }

    public function test_admin_can_update_follow_up(): void
    {
        $lead     = Lead::factory()->create();
        $followUp = LeadFollowUp::factory()->create([
            'lead_id'       => $lead->id,
            'actor_user_id' => $this->adminUser()->id,
        ]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/lead-follow-ups/{$followUp->id}", [
                'action' => 'Updated action',
            ])
            ->assertOk()
            ->assertJsonPath('data.action', 'Updated action');
    }

    public function test_admin_can_complete_follow_up(): void
    {
        $lead     = Lead::factory()->create();
        $followUp = LeadFollowUp::factory()->create([
            'lead_id'       => $lead->id,
            'actor_user_id' => $this->adminUser()->id,
            'completed_at'  => null,
        ]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/lead-follow-ups/{$followUp->id}/complete", [
                'completion_notes' => 'Done',
            ])
            ->assertOk();

        $this->assertNotNull($followUp->fresh()->completed_at);
    }

    public function test_admin_can_delete_follow_up(): void
    {
        $lead     = Lead::factory()->create();
        $followUp = LeadFollowUp::factory()->create([
            'lead_id'       => $lead->id,
            'actor_user_id' => $this->adminUser()->id,
        ]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->deleteJson("/api/system/lead-follow-ups/{$followUp->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Follow-up deleted.');
    }

    // -------------------------------------------------------- AUTHORIZATION ---

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

    public function test_teacher_cannot_delete_lead(): void
    {
        $lead = Lead::factory()->create();
        ['user' => $teacherUser] = $this->teacherUser();

        $this->actingAs($teacherUser, 'sanctum')
            ->deleteJson("/api/system/leads/{$lead->id}")
            ->assertForbidden();
    }

    public function test_guest_cannot_access_leads(): void
    {
        $this->getJson('/api/system/leads')->assertUnauthorized();
    }
}
