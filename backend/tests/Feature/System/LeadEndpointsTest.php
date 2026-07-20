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

        // A new lead provisions a real student (+ user, role=student) with no payment data yet.
        $lead = \App\Models\System\Lead::where('email', 'sara@example.com')->firstOrFail();
        $this->assertNotNull($lead->student_id);
        $this->assertDatabaseHas('sys_students', ['id' => $lead->student_id, 'status' => 'trial']);
    }

    public function test_lead_assigned_teacher_flows_onto_provisioned_student(): void
    {
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/leads', [
                'name'                => 'Yousef Ali',
                'source'              => 'manual_entry',
                'assigned_teacher_id' => $teacher->id,
            ])
            ->assertCreated();

        $lead = Lead::where('name', 'Yousef Ali')->firstOrFail();

        // The teacher is set on the student (not the lead) so it's filterable in the calendar.
        $this->assertDatabaseHas('sys_students', [
            'id'                  => $lead->student_id,
            'assigned_teacher_id' => $teacher->id,
        ]);

        // Assigning a teacher up front advances the lead to "waiting for trial".
        $this->assertSame('waiting_for_trial', $lead->status);

        // The student list endpoint filters by that teacher.
        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/students?filter[assigned_teacher_id]={$teacher->id}")
            ->assertOk()
            ->assertJsonPath('data.0.id', $lead->student_id);

        // The lead resource surfaces the assigned teacher (so the dialog can prefill it on close).
        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/leads/{$lead->id}")
            ->assertOk()
            ->assertJsonPath('data.assigned_teacher_id', $teacher->id);
    }

    public function test_assigning_teacher_on_update_advances_lead_to_waiting_for_trial(): void
    {
        // Lead created without a teacher → stays new_lead.
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/leads', ['name' => 'Late Assign', 'source' => 'manual_entry'])
            ->assertCreated();

        $lead    = Lead::where('name', 'Late Assign')->firstOrFail();
        $teacher = Teacher::factory()->create();
        $this->assertSame('new_lead', $lead->status);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/leads/{$lead->id}", ['assigned_teacher_id' => $teacher->id])
            ->assertOk();

        $this->assertSame('waiting_for_trial', $lead->fresh()->status);
        $this->assertDatabaseHas('sys_students', ['id' => $lead->student_id, 'assigned_teacher_id' => $teacher->id]);
    }

    public function test_creating_a_trial_lesson_advances_lead_to_waiting_for_payment(): void
    {
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/leads', [
                'name' => 'Trial Kid', 'source' => 'manual_entry', 'assigned_teacher_id' => $teacher->id,
            ])
            ->assertCreated();

        $lead = Lead::where('name', 'Trial Kid')->firstOrFail();
        $this->assertSame('waiting_for_trial', $lead->status);

        // The teacher logs a trial lesson + report for the student.
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/lessons', [
                'teacher_id'       => $teacher->id,
                'student_id'       => $lead->student_id,
                'scheduled_at'     => now()->toISOString(),
                'duration_minutes' => 60,
                'status'           => 'trial',
            ])
            ->assertCreated();

        $this->assertSame('waiting_for_payment', $lead->fresh()->status);
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

    public function test_lead_can_move_freely_between_open_statuses(): void
    {
        // Free movement: new_lead -> waiting_for_payment (skipping stages) is now allowed.
        $lead = Lead::factory()->newLead()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/leads/{$lead->id}", ['status' => 'waiting_for_payment'])
            ->assertOk()
            ->assertJsonPath('data.status', 'waiting_for_payment');

        $this->assertDatabaseHas('sys_leads', ['id' => $lead->id, 'status' => 'waiting_for_payment']);
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

    public function test_supervisor_can_move_owned_lead_backward(): void
    {
        // Free movement: a supervisor who owns the lead can move it to any open status,
        // including an earlier pipeline stage.
        $supervisor = $this->supervisorUser();
        $lead = Lead::factory()->interested()->create(['assigned_supervisor_id' => $supervisor->id]);

        $this->actingAs($supervisor, 'sanctum')
            ->patchJson("/api/system/leads/{$lead->id}", ['status' => 'new_lead'])
            ->assertOk()
            ->assertJsonPath('data.status', 'new_lead');
    }

    public function test_closed_lead_cannot_be_moved_back_through_pipeline(): void
    {
        $lead = Lead::factory()->closed()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/leads/{$lead->id}", ['status' => 'interested'])
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
                'session_duration_min' => 60,
                'package_hours'        => 8,
                'package_price_minor'  => 120000,
                'currency'             => 'EGP',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Lead converted to student.');

        $this->assertDatabaseHas('sys_leads', [
            'id'     => $lead->id,
            'status' => 'closed',
        ]);
        $this->assertDatabaseHas('sys_students', [
            'lead_id'               => $lead->id,
            'package_hours_default' => 8,
            'hourly_rate_minor'     => 120000,
        ]);

        // The first payment is a down payment (Package #0) priced at one package — its own charge,
        // not tied to lessons. No lesson package (#1) is created until real lessons are scheduled,
        // so a brand-new student is never "pending" for lessons they haven't taken.
        $student = \App\Models\System\Student::where('lead_id', $lead->id)->firstOrFail();
        $this->assertDatabaseHas('sys_student_packages', [
            'student_id'     => $student->id,
            'package_number' => 0,
            'package_hours'  => 0,
            'tariff_at_time' => 120000,
            'status'         => 'pending',
        ]);
        $this->assertDatabaseMissing('sys_student_packages', [
            'student_id'     => $student->id,
            'package_number' => 1,
        ]);
    }

    public function test_quick_close_converts_with_only_hours_and_price(): void
    {
        // A lead that was already provisioned a student (as the store endpoint does) with its own
        // teacher/timezone/type. The quick "Closed" flow sends only package_hours + price.
        $teacher = Teacher::factory()->create();
        $lead    = Lead::factory()->waitingForPayment()->create();
        $student = \App\Models\System\Student::factory()->create([
            'timezone'            => 'Asia/Riyadh',
            'student_type'        => 'adult',
            'assigned_teacher_id' => $teacher->id,
            'lead_id'             => $lead->id,
            'status'              => 'trial',
        ]);
        $lead->update(['student_id' => $student->id]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/leads/{$lead->id}/convert", [
                'package_hours'       => 6,
                'package_price_minor' => 90000,
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Lead converted to student.');

        // Lead is closed; the provisioned student is now active and appears in /users.
        $this->assertDatabaseHas('sys_leads', ['id' => $lead->id, 'status' => 'closed']);
        $student->refresh();
        $this->assertSame('active', $student->status);
        // Enrollment details we did NOT send are kept from the provisioned student.
        $this->assertSame('Asia/Riyadh', $student->timezone, 'provisioned timezone preserved');
        $this->assertSame('adult', $student->student_type);
        $this->assertSame($teacher->id, $student->assigned_teacher_id, 'assigned teacher preserved');
        // The two values we DID send seed the package defaults + down payment.
        $this->assertSame(6, (int) $student->package_hours_default);
        $this->assertSame(90000, (int) $student->hourly_rate_minor);
        $this->assertDatabaseHas('sys_student_packages', [
            'student_id'     => $student->id,
            'package_number' => 0,
            'tariff_at_time' => 90000,
            'status'         => 'pending',
        ]);
        $this->assertDatabaseMissing('sys_student_packages', [
            'student_id'     => $student->id,
            'package_number' => 1,
        ]);
    }

    public function test_convert_requires_package_hours_and_price(): void
    {
        $lead = Lead::factory()->waitingForPayment()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/leads/{$lead->id}/convert", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['package_hours', 'package_price_minor']);
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
                'session_duration_min' => 60,
                'package_hours'        => 8,
                'package_price_minor'  => 120000,
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
