<?php

namespace Tests\Feature\System;

use App\Models\System\Guardian;
use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Models\User;
use Tests\SystemTestCase;

class UserUnificationBackfillTest extends SystemTestCase
{
    public function test_student_factory_with_user_links_a_student_user(): void
    {
        $student = Student::factory()->withUser()->create();

        $this->assertNotNull($student->user_id);
        $this->assertSame('student', $student->user->role);
        $this->assertTrue($student->user->hasRole('student'));
        $this->assertDatabaseHas('sys_user_emails', [
            'user_id'    => $student->user_id,
            'is_primary' => true,
        ]);
    }

    public function test_student_status_maps_onto_user_status(): void
    {
        $cancelled = Student::factory()->cancelled()->withUser()->create();
        $this->assertSame('archived', $cancelled->user->status);

        $paused = Student::factory()->paused()->withUser()->create();
        $this->assertSame('inactive', $paused->user->status);
    }

    public function test_guardian_factory_with_user_links_a_parent_user(): void
    {
        $guardian = Guardian::factory()->withUser()->create();

        $this->assertNotNull($guardian->user_id);
        $this->assertSame('parent', $guardian->user->role);
        $this->assertTrue($guardian->user->hasRole('parent'));
    }

    public function test_teacher_factory_aligns_linked_user(): void
    {
        $teacher = Teacher::factory()->create();

        $this->assertSame('teacher', $teacher->user->role);
        $this->assertSame('active', $teacher->user->status);
        $this->assertTrue($teacher->user->hasRole('teacher'));
    }

    public function test_user_profile_relations_resolve(): void
    {
        $student = Student::factory()->withUser()->create();
        $user    = $student->user->fresh();

        $this->assertTrue($user->studentProfile()->exists());
        $this->assertSame($student->id, $user->studentProfile->id);
        $this->assertTrue($user->emails()->exists());
    }

    public function test_sync_status_mirrors_is_active(): void
    {
        $user = User::factory()->create(['status' => 'active', 'is_active' => true]);

        $user->syncStatus('suspended');

        $this->assertSame('suspended', $user->status);
        $this->assertFalse($user->fresh()->is_active);
    }

    public function test_backfill_migration_links_legacy_students_and_guardians(): void
    {
        // Simulate legacy rows that predate the unification (no user_id).
        $guardian = Guardian::factory()->create();
        $student  = Student::factory()->create([
            'student_type' => 'child',
            'guardian_id'  => $guardian->id,
        ]);

        $this->assertNull($student->user_id);
        $this->assertNull($guardian->user_id);

        $this->runBackfillMigration('2026_09_20_000008_backfill_users_for_students.php');
        $this->runBackfillMigration('2026_09_20_000009_backfill_users_for_guardians.php');

        $student->refresh();
        $guardian->refresh();

        $this->assertNotNull($student->user_id, 'Student should be linked to a user');
        $this->assertSame('student', $student->user->role);
        $this->assertNotNull($guardian->user_id, 'Guardian should be linked to a user');
        $this->assertSame('parent', $guardian->user->role);

        // The guardian relationship must survive the transition.
        $this->assertSame($guardian->id, $student->guardian_id);
    }

    public function test_backfill_preserves_existing_student_id_for_relations(): void
    {
        $student = Student::factory()->create();
        $originalId = $student->id;

        $this->runBackfillMigration('2026_09_20_000008_backfill_users_for_students.php');

        $this->assertSame($originalId, $student->fresh()->id, 'student.id (referenced by billing/scheduling FKs) must not change');
    }

    private function runBackfillMigration(string $file): void
    {
        $migration = require database_path("migrations/{$file}");
        $migration->up();
    }
}
