<?php

namespace Tests\Feature\System;

use App\Models\System\Lesson;
use App\Models\System\Session;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Task;
use App\Models\System\Teacher;
use App\Models\User;
use App\Services\System\TaskGenerator;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\SystemTestCase;

class TaskEndpointsTest extends SystemTestCase
{
    private function supervisor(): User
    {
        return $this->staffUser('supervisor');
    }

    private function accountant(): User
    {
        return $this->staffUser('accountant');
    }

    /** A user whose role grants only tasks.view (no view_any) — for view-scoping. */
    private function viewOnlyAgent(string $role = 'agent_role'): User
    {
        Permission::firstOrCreate(['name' => 'tasks.view', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web'])->givePermissionTo('tasks.view');

        $user = User::factory()->create(['role' => $role, 'is_active' => true, 'status' => 'active']);
        $user->syncRoles([$role]);

        return $user->fresh();
    }

    private function makeLesson(): array
    {
        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $package = StudentPackage::create([
            'student_id' => $student->id, 'package_number' => 1, 'package_hours' => 8,
            'tariff_at_time' => 10000, 'currency' => 'EUR', 'status' => 'pending',
        ]);
        $lesson = Lesson::create([
            'package_id' => $package->id, 'teacher_id' => $teacher->id, 'student_id' => $student->id,
            'scheduled_at' => now(), 'duration_minutes' => 60, 'status' => 'absent',
        ]);
        return compact('student', 'teacher', 'package', 'lesson');
    }

    // ════════════════════════════════════════════════════════════ READ ═══

    public function test_admin_can_list_tasks(): void
    {
        Task::factory()->count(3)->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/tasks')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'type', 'status', 'priority', 'title', 'actionable']], 'meta']);
    }

    public function test_list_is_paginated(): void
    {
        Task::factory()->count(5)->create();

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/tasks?per_page=2')
            ->assertOk();

        $this->assertCount(2, $res->json('data'));
        $this->assertSame(2, $res->json('meta.per_page'));
        $this->assertSame(5, $res->json('meta.total'));
    }

    public function test_list_filters_by_status(): void
    {
        Task::factory()->status('new')->count(2)->create();
        Task::factory()->status('done')->create();

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/tasks?filter[status]=new')->assertOk();
        $this->assertCount(2, $res->json('data'));
    }

    public function test_list_filters_by_type(): void
    {
        Task::factory()->type('schedule_removal')->create();
        Task::factory()->type('manual_task')->create();

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/tasks?filter[type]=schedule_removal')->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('schedule_removal', $res->json('data.0.type'));
    }

    public function test_list_filters_by_priority(): void
    {
        Task::factory()->create(['priority' => 'urgent']);
        Task::factory()->create(['priority' => 'low']);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/tasks?filter[priority]=urgent')->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('urgent', $res->json('data.0.priority'));
    }

    public function test_list_filters_by_assignee_role(): void
    {
        Task::factory()->create(['assignee_role' => 'accountant']);
        Task::factory()->create(['assignee_role' => 'supervisor']);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/tasks?filter[assignee_role]=accountant')->assertOk();
        $this->assertCount(1, $res->json('data'));
    }

    public function test_list_filters_by_student_and_teacher(): void
    {
        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        Task::factory()->create(['student_id' => $student->id, 'teacher_id' => $teacher->id]);
        Task::factory()->create();

        $byStudent = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/tasks?filter[student_id]={$student->id}")->assertOk();
        $this->assertCount(1, $byStudent->json('data'));

        $byTeacher = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/tasks?filter[teacher_id]={$teacher->id}")->assertOk();
        $this->assertCount(1, $byTeacher->json('data'));
    }

    public function test_list_searches_by_title(): void
    {
        Task::factory()->create(['title' => 'Distinctive package review']);
        Task::factory()->create(['title' => 'Something else']);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/tasks?filter[q]=Distinctive')->assertOk();
        $this->assertCount(1, $res->json('data'));
    }

    public function test_list_filters_by_date_range(): void
    {
        $old = Task::factory()->create();
        $old->forceFill(['created_at' => now()->subDays(10)])->saveQuietly();
        Task::factory()->create(); // today

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/tasks?filter[from_date]=' . now()->subDay()->toDateString())->assertOk();
        $this->assertCount(1, $res->json('data'));
    }

    public function test_mine_filter_limits_to_users_roles(): void
    {
        Task::factory()->create(['assignee_role' => 'supervisor']);
        Task::factory()->create(['assignee_role' => 'accountant']);

        $res = $this->actingAs($this->supervisor(), 'sanctum')
            ->getJson('/api/system/tasks?filter[mine]=1')->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('supervisor', $res->json('data.0.assignee_role'));
    }

    public function test_admin_can_view_single_task_with_notes_and_activities(): void
    {
        $task = Task::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/tasks/{$task->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $task->id)
            ->assertJsonStructure(['data' => ['id', 'type', 'status', 'notes', 'activities']]);
    }

    // ══════════════════════════════════════════════════════════ CREATE ═══

    public function test_admin_can_create_manual_task(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/tasks', ['title' => 'Call the parent', 'priority' => 'high'])
            ->assertCreated()
            ->assertJsonPath('data.type', 'manual_task')
            ->assertJsonPath('data.title', 'Call the parent')
            ->assertJsonPath('data.status', 'new');

        $this->assertDatabaseHas('sys_tasks', ['title' => 'Call the parent', 'type' => 'manual_task']);
    }

    public function test_create_records_creator_and_optional_fields(): void
    {
        $admin   = $this->adminUser();
        $student = Student::factory()->create();

        $res = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/system/tasks', [
                'title' => 'Follow up', 'body' => 'Some details', 'priority' => 'urgent',
                'assignee_role' => 'supervisor', 'student_id' => $student->id,
                'due_at' => now()->addDays(3)->toDateTimeString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.priority', 'urgent')
            ->assertJsonPath('data.assignee_role', 'supervisor');

        $this->assertDatabaseHas('sys_tasks', [
            'id' => $res->json('data.id'), 'created_by' => $admin->id, 'student_id' => $student->id,
        ]);
    }

    public function test_create_requires_title(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/tasks', ['priority' => 'high'])
            ->assertStatus(422)->assertJsonValidationErrors(['title']);
    }

    public function test_create_rejects_invalid_priority(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/tasks', ['title' => 'X', 'priority' => 'super'])
            ->assertStatus(422)->assertJsonValidationErrors(['priority']);
    }

    public function test_create_rejects_invalid_type(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/tasks', ['title' => 'X', 'type' => 'not_a_type'])
            ->assertStatus(422)->assertJsonValidationErrors(['type']);
    }

    // ══════════════════════════════════════════════════════════ UPDATE ═══

    public function test_admin_can_update_fields(): void
    {
        $task = Task::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/tasks/{$task->id}", ['title' => 'Renamed', 'priority' => 'low'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Renamed')
            ->assertJsonPath('data.priority', 'low');
    }

    public function test_admin_can_advance_status(): void
    {
        $task = Task::factory()->status('new')->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/tasks/{$task->id}", ['status' => 'following_up'])
            ->assertOk()->assertJsonPath('data.status', 'following_up');
    }

    public function test_status_can_walk_full_pipeline(): void
    {
        $task = Task::factory()->status('new')->create();
        $admin = $this->adminUser();

        foreach (['following_up', 'review_underway', 'done'] as $next) {
            $this->actingAs($admin, 'sanctum')
                ->patchJson("/api/system/tasks/{$task->id}", ['status' => $next])
                ->assertOk()->assertJsonPath('data.status', $next);
        }
    }

    public function test_invalid_status_value_is_rejected(): void
    {
        $task = Task::factory()->status('new')->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/tasks/{$task->id}", ['status' => 'bogus'])
            ->assertStatus(422)->assertJsonValidationErrors(['status']);
    }

    public function test_forbidden_transition_from_review_underway_to_new(): void
    {
        $task = Task::factory()->status('review_underway')->create(['assignee_role' => 'supervisor']);

        $this->actingAs($this->supervisor(), 'sanctum')
            ->patchJson("/api/system/tasks/{$task->id}", ['status' => 'new'])
            ->assertStatus(422)->assertJsonValidationErrors(['status']);
    }

    public function test_non_admin_cannot_reopen_done_task(): void
    {
        $task = Task::factory()->status('done')->create(['assignee_role' => 'supervisor']);

        $this->actingAs($this->supervisor(), 'sanctum')
            ->patchJson("/api/system/tasks/{$task->id}", ['status' => 'new'])
            ->assertStatus(422)->assertJsonValidationErrors(['status']);
    }

    public function test_admin_can_reopen_done_task(): void
    {
        $task = Task::factory()->status('done')->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/tasks/{$task->id}", ['status' => 'following_up'])
            ->assertOk()->assertJsonPath('data.status', 'following_up');
    }

    // ══════════════════════════════════════════════════════════ ASSIGN ═══

    public function test_admin_can_assign_role_and_user(): void
    {
        $task = Task::factory()->create(['assignee_role' => null]);
        $sup  = $this->supervisor();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/tasks/{$task->id}/assign", [
                'assignee_role' => 'quality', 'assignee_user_id' => $sup->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.assignee_role', 'quality')
            ->assertJsonPath('data.assignee_user_id', $sup->id);

        $this->assertDatabaseHas('sys_tasks', ['id' => $task->id, 'assignee_role' => 'quality', 'assignee_user_id' => $sup->id]);
    }

    public function test_assign_rejects_unknown_user(): void
    {
        $task = Task::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/tasks/{$task->id}/assign", ['assignee_user_id' => 999999])
            ->assertStatus(422)->assertJsonValidationErrors(['assignee_user_id']);
    }

    // ════════════════════════════════════════════════════════ POSTPONE ═══

    public function test_postpone_sets_status_and_due_date(): void
    {
        $task = Task::factory()->status('new')->create();
        $due  = now()->addWeek()->toDateTimeString();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/tasks/{$task->id}/postpone", ['due_at' => $due])
            ->assertOk()->assertJsonPath('data.status', 'postponed');

        $this->assertNotNull($task->fresh()->due_at);
    }

    // ════════════════════════════════════════════════════════ DECISIONS ═══

    public function test_approving_absent_paid_marks_lesson_paid_absence(): void
    {
        ['lesson' => $lesson, 'student' => $student, 'teacher' => $teacher] = $this->makeLesson();

        $task = Task::factory()->absentPaidApproval($lesson->id)->create([
            'student_id' => $student->id, 'teacher_id' => $teacher->id,
        ]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/tasks/{$task->id}/approve", ['notes' => 'Confirmed'])
            ->assertOk()
            ->assertJsonPath('data.decision', 'approved')
            ->assertJsonPath('data.status', 'done');

        $this->assertSame('paid_absence', $lesson->fresh()->status);
    }

    public function test_approving_late_lesson_deduction_creates_payroll_adjustment(): void
    {
        $teacher = Teacher::factory()->create();
        $task = Task::factory()->lateLessonDeduction(7500)->create([
            'teacher_id' => $teacher->id,
            'payload'    => ['amount_minor' => 7500, 'scheduled_at' => now()->toISOString()],
        ]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/tasks/{$task->id}/approve")
            ->assertOk()->assertJsonPath('data.decision', 'approved');

        $this->assertDatabaseHas('sys_payroll_adjustments', [
            'type' => 'deduction', 'category' => 'late_arrival', 'amount_minor' => 7500,
        ]);
    }

    public function test_accountant_can_approve_deduction(): void
    {
        $teacher = Teacher::factory()->create();
        $task = Task::factory()->lateLessonDeduction(3000)->create([
            'teacher_id' => $teacher->id, 'assignee_role' => 'accountant',
            'payload'    => ['amount_minor' => 3000, 'scheduled_at' => now()->toISOString()],
        ]);

        $this->actingAs($this->accountant(), 'sanctum')
            ->postJson("/api/system/tasks/{$task->id}/approve")
            ->assertOk()->assertJsonPath('data.decision', 'approved');
    }

    public function test_reject_records_decision_without_side_effect(): void
    {
        $task = Task::factory()->lateLessonDeduction(5000)->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/tasks/{$task->id}/reject", ['notes' => 'Not warranted'])
            ->assertOk()->assertJsonPath('data.decision', 'rejected');

        $this->assertDatabaseCount('sys_payroll_adjustments', 0);
    }

    public function test_non_actionable_task_cannot_be_approved(): void
    {
        $task = Task::factory()->type('package_complete')->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/tasks/{$task->id}/approve")
            ->assertForbidden();
    }

    public function test_already_decided_task_cannot_be_approved_again(): void
    {
        $task = Task::factory()->lateLessonDeduction()->create([
            'decision' => 'approved', 'decided_at' => now(),
        ]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/tasks/{$task->id}/approve")
            ->assertStatus(422);
    }

    // ═════════════════════════════════════════════════════════════ NOTES ═══

    public function test_add_and_list_notes(): void
    {
        $task  = Task::factory()->create();
        $admin = $this->adminUser();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/system/tasks/{$task->id}/notes", ['body' => 'Looking into this'])
            ->assertCreated()
            ->assertJsonPath('data.body', 'Looking into this');

        $this->assertDatabaseHas('sys_task_notes', ['task_id' => $task->id, 'body' => 'Looking into this']);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/system/tasks/{$task->id}/notes")
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_note_requires_body(): void
    {
        $task = Task::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/tasks/{$task->id}/notes", [])
            ->assertStatus(422)->assertJsonValidationErrors(['body']);
    }

    public function test_note_appears_in_task_detail(): void
    {
        $task = Task::factory()->create();
        $admin = $this->adminUser();
        $this->actingAs($admin, 'sanctum')->postJson("/api/system/tasks/{$task->id}/notes", ['body' => 'Note A']);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/system/tasks/{$task->id}")
            ->assertOk()->assertJsonPath('data.notes.0.body', 'Note A');
    }

    // ═════════════════════════════════════════════════════════════ DELETE ═══

    public function test_admin_can_delete_task(): void
    {
        $task = Task::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->deleteJson("/api/system/tasks/{$task->id}")
            ->assertOk()->assertJsonPath('message', 'Task deleted.');

        $this->assertSoftDeleted('sys_tasks', ['id' => $task->id]);
    }

    public function test_supervisor_cannot_delete_task(): void
    {
        $task = Task::factory()->create(['assignee_role' => 'supervisor']);

        $this->actingAs($this->supervisor(), 'sanctum')
            ->deleteJson("/api/system/tasks/{$task->id}")
            ->assertForbidden();
    }

    // ═══════════════════════════════════════════════════════ GENERATORS ═══

    public function test_session_cancellation_generates_one_task(): void
    {
        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $session = Session::factory()->create([
            'student_id' => $student->id, 'teacher_id' => $teacher->id, 'status' => 'scheduled',
        ]);

        $session->update(['status' => 'cancelled', 'cancelled_by' => 'admin']);
        $session->update(['cancellation_reason' => 'changed mind']); // second update, still cancelled

        $this->assertSame(1, Task::where('type', 'schedule_removal')->where('related_id', $session->id)->count());

        $task = Task::where('type', 'schedule_removal')->where('related_id', $session->id)->first();
        $this->assertSame($student->id, $task->student_id);
        $this->assertSame('schedule_removal', $task->type);
    }

    public function test_package_complete_generator_is_idempotent(): void
    {
        ['package' => $package] = $this->makeLesson();
        $generator = app(TaskGenerator::class);

        $generator->forPackageComplete($package);
        $generator->forPackageComplete($package);

        $this->assertSame(1, Task::where('type', 'package_complete')->where('related_id', $package->id)->count());

        $task = Task::where('type', 'package_complete')->first();
        $this->assertFalse(Task::isActionable('package_complete'));
        $this->assertSame(1, (int) ($task->payload['package_number'] ?? 0));
    }

    // ═══════════════════════════════════════════════════ AUTHORIZATION ═══

    public function test_supervisor_with_view_any_can_view_any_task(): void
    {
        $task = Task::factory()->create(['assignee_role' => 'accountant']);

        $this->actingAs($this->supervisor(), 'sanctum')
            ->getJson("/api/system/tasks/{$task->id}")->assertOk();
    }

    public function test_view_only_user_can_view_own_role_task_but_not_others(): void
    {
        $agent = $this->viewOnlyAgent('agent_role');

        $own   = Task::factory()->create(['assignee_role' => 'agent_role']);
        $other = Task::factory()->create(['assignee_role' => 'accountant']);

        $this->actingAs($agent, 'sanctum')->getJson("/api/system/tasks/{$own->id}")->assertOk();
        $this->actingAs($agent, 'sanctum')->getJson("/api/system/tasks/{$other->id}")->assertForbidden();
    }

    public function test_teacher_cannot_list_tasks(): void
    {
        ['user' => $teacherUser] = $this->teacherUser();

        $this->actingAs($teacherUser, 'sanctum')
            ->getJson('/api/system/tasks')->assertForbidden();
    }

    public function test_teacher_cannot_create_task(): void
    {
        ['user' => $teacherUser] = $this->teacherUser();

        $this->actingAs($teacherUser, 'sanctum')
            ->postJson('/api/system/tasks', ['title' => 'X'])->assertForbidden();
    }

    public function test_guest_cannot_access_tasks(): void
    {
        $this->getJson('/api/system/tasks')->assertUnauthorized();
    }
}
