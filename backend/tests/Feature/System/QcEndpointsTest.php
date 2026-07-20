<?php

namespace Tests\Feature\System;

use App\Models\System\QcCategory;
use App\Models\System\QcEvaluation;
use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Models\User;
use Database\Seeders\System\QcSeeder;
use Tests\SystemTestCase;

class QcEndpointsTest extends SystemTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(QcSeeder::class);
    }

    /** All active checklist item ids (i.e. a fully-ticked evaluation). */
    private function allItemIds(): array
    {
        return QcCategory::with('items')->get()
            ->flatMap(fn ($c) => $c->items->pluck('id'))
            ->all();
    }

    private function cameraItemId(): int
    {
        return QcCategory::with('items')->get()
            ->flatMap(fn ($c) => $c->items)
            ->firstWhere('special_rule_key', 'camera_cap')->id;
    }

    private function subject(): array
    {
        return ['teacher' => Teacher::factory()->create(), 'student' => Student::factory()->create()];
    }

    // ═══════════════════════════════════════════════════════ EVALUATIONS ═══

    public function test_admin_can_create_a_fully_checked_evaluation_scoring_100(): void
    {
        ['teacher' => $teacher, 'student' => $student] = $this->subject();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/quality-control/evaluations', [
                'teacher_id'       => $teacher->id,
                'student_id'       => $student->id,
                'duration_minutes' => 15,
                'checked_item_ids' => $this->allItemIds(),
                'general_notes'    => 'Great lesson',
            ])
            ->assertCreated()
            ->assertJsonPath('data.score', 100)
            ->assertJsonPath('data.teacher_id', $teacher->id);

        $this->assertDatabaseCount('sys_qc_evaluations', 1);
        // one snapshot row per active item
        $this->assertDatabaseCount('sys_qc_evaluation_items', count($this->allItemIds()));
    }

    public function test_unchecked_item_lowers_the_persisted_score(): void
    {
        ['teacher' => $teacher, 'student' => $student] = $this->subject();
        $all = $this->allItemIds();
        // Drop one 5% item ("No boredom") — leave everything else, camera included.
        $checked = array_slice($all, 1);

        $res = $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/quality-control/evaluations', [
                'teacher_id'       => $teacher->id,
                'student_id'       => $student->id,
                'duration_minutes' => 10,
                'checked_item_ids' => $checked,
            ])->assertCreated();

        $this->assertLessThan(100, $res->json('data.score'));
    }

    public function test_camera_off_caps_score_at_30(): void
    {
        ['teacher' => $teacher, 'student' => $student] = $this->subject();
        $checked = array_values(array_diff($this->allItemIds(), [$this->cameraItemId()]));

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/quality-control/evaluations', [
                'teacher_id'       => $teacher->id,
                'student_id'       => $student->id,
                'duration_minutes' => 15,
                'checked_item_ids' => $checked,
            ])
            ->assertCreated()
            ->assertJsonPath('data.score', 30);
    }

    public function test_index_returns_summary_totals(): void
    {
        ['teacher' => $teacher, 'student' => $student] = $this->subject();
        QcEvaluation::factory()->count(2)->create([
            'teacher_id' => $teacher->id, 'student_id' => $student->id, 'duration_minutes' => 15,
        ]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/quality-control/evaluations')
            ->assertOk()
            ->assertJsonPath('summary.count', 2)
            ->assertJsonPath('summary.total_duration_minutes', 30);
    }

    public function test_update_recomputes_score(): void
    {
        ['teacher' => $teacher, 'student' => $student] = $this->subject();
        $created = $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/quality-control/evaluations', [
                'teacher_id'       => $teacher->id,
                'student_id'       => $student->id,
                'duration_minutes' => 15,
                'checked_item_ids' => $this->allItemIds(),
            ])->json('data');

        $this->assertSame(100.0, (float) $created['score']);

        // Re-open with the camera item unchecked → capped at 30.
        $checked = array_values(array_diff($this->allItemIds(), [$this->cameraItemId()]));
        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/quality-control/evaluations/{$created['id']}", [
                'checked_item_ids' => $checked,
            ])
            ->assertOk()
            ->assertJsonPath('data.score', 30);
    }

    public function test_admin_can_soft_delete_an_evaluation(): void
    {
        $eval = QcEvaluation::factory()->create();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->deleteJson("/api/system/quality-control/evaluations/{$eval->id}")
            ->assertOk();

        $this->assertSoftDeleted('sys_qc_evaluations', ['id' => $eval->id]);
    }

    // ═══════════════════════════════════════════════════════ PERMISSIONS ═══

    public function test_quality_role_can_create_evaluations(): void
    {
        ['teacher' => $teacher, 'student' => $student] = $this->subject();

        $this->actingAs($this->staffUser('quality'), 'sanctum')
            ->postJson('/api/system/quality-control/evaluations', [
                'teacher_id'       => $teacher->id,
                'student_id'       => $student->id,
                'duration_minutes' => 15,
                'checked_item_ids' => $this->allItemIds(),
            ])
            ->assertCreated();
    }

    public function test_user_without_qc_permission_is_forbidden(): void
    {
        $user = User::factory()->create(['role' => 'accountant', 'is_active' => true, 'status' => 'active']);
        $user->syncRoles(['accountant']); // accountant has no qc.* perms

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/quality-control/evaluations')
            ->assertForbidden();
    }

    // ═════════════════════════════════════════════════════════ SETTINGS ═══

    public function test_config_endpoint_returns_seeded_checklist(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/quality-control/config')
            ->assertOk()
            ->assertJsonPath('data.categories.0.penalties_sum', 15) // Simplicity & Clarity = 8 + 7
            ->assertJsonCount(1, 'data.special_rules');
    }

    public function test_admin_can_crud_a_category_and_item(): void
    {
        $cat = $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/quality-control/categories', ['name' => 'New Cat', 'weight' => 10])
            ->assertCreated()->json('data');

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson("/api/system/quality-control/categories/{$cat['id']}/items", ['label' => 'New item', 'penalty' => 4])
            ->assertCreated()
            ->assertJsonPath('data.penalty', 4);

        $this->assertDatabaseHas('sys_qc_category_items', ['label' => 'New item', 'penalty' => 4]);
    }

    public function test_admin_can_create_a_special_rule(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/quality-control/special-rules', [
                'rule_key' => 'attention_cap', 'label' => 'Attention cap', 'cap_value' => 50,
            ])
            ->assertCreated()
            ->assertJsonPath('data.cap_value', 50);
    }
}
