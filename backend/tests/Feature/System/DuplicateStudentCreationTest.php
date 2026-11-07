<?php

namespace Tests\Feature\System;

use App\Models\System\Lead;
use App\Models\System\Student;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Tests\SystemTestCase;

/**
 * "Sometimes adding a student creates a duplicate with a strange email." Every path that could
 * provision the same person twice: a walk-in closed in two requests, a form submitted twice, and
 * a save that committed but still answered with an error. The copy always carried a synthesized
 * address, because the first one had already taken the real email.
 */
class DuplicateStudentCreationTest extends SystemTestCase
{
    private function walkIn(array $overrides = []): array
    {
        return array_merge([
            'name'    => 'Walk In',
            'email'   => 'walk.in@example.com',
            'phone'   => '+33600000000',
            'status'  => 'waiting_for_payment',
            'convert' => ['package_hours' => 8, 'package_price_minor' => 12000, 'currency' => 'EUR'],
        ], $overrides);
    }

    // ------------------------------------------------------- walk-in close ---

    public function test_a_walk_in_is_created_and_closed_in_one_request(): void
    {
        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/leads', $this->walkIn())
            ->assertCreated()
            ->assertJsonPath('data.status', 'closed');

        $lead    = Lead::findOrFail($response->json('data.id'));
        $student = Student::where('name', 'Walk In')->sole();

        $this->assertSame($student->id, $lead->student_id);
        $this->assertSame($student->id, $lead->converted_to_student_id);
        $this->assertSame('active', $student->status);
        $this->assertSame('walk.in@example.com', $student->user->email, 'keeps the real address');
        $this->assertDatabaseHas('sys_student_packages', [
            'student_id'     => $student->id,
            'package_number' => 0,
            'package_hours'  => 8,
            'tariff_at_time' => 12000,
            'status'         => 'paid',
        ]);
    }

    public function test_a_walk_in_whose_conversion_fails_leaves_nothing_behind(): void
    {
        // Can create leads but not convert them: the conversion half is refused.
        Role::firstOrCreate(['name' => 'intake', 'guard_name' => 'web'])
            ->syncPermissions(['leads.create', 'leads.view', 'leads.view_any']);
        $intake = User::factory()->create(['role' => 'supervisor', 'is_active' => true]);
        $intake->syncRoles(['intake']);

        $this->actingAs($intake, 'sanctum')
            ->postJson('/api/system/leads', $this->walkIn())
            ->assertForbidden();

        // As two requests, the lead and its student stayed saved here — and the retry made a second.
        $this->assertSame(0, Lead::count());
        $this->assertSame(0, Student::count());
        $this->assertDatabaseMissing('users', ['email' => 'walk.in@example.com']);
    }

    public function test_a_walk_in_needs_hours_and_price(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/leads', $this->walkIn(['convert' => ['currency' => 'EUR']]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['convert.package_hours', 'convert.package_price_minor']);

        $this->assertSame(0, Student::count());
    }

    // ------------------------------------------------------ repeated submit ---

    public function test_a_repeated_lead_submission_creates_the_student_once(): void
    {
        $admin   = $this->adminUser();
        $headers = ['Idempotency-Key' => 'form-1:walk%20in'];

        $first = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/system/leads', $this->walkIn(), $headers)
            ->assertCreated();

        $again = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/system/leads', $this->walkIn(), $headers)
            ->assertCreated()
            ->assertHeader('Idempotent-Replayed', 'true');

        $this->assertSame($first->json('data.id'), $again->json('data.id'));
        $this->assertSame(1, Lead::count());
        $this->assertSame(1, Student::count());
        $this->assertDatabaseMissing('users', ['email' => 'walk.in@students.alrayanquran.com']);
    }

    public function test_a_repeated_student_submission_creates_the_student_once(): void
    {
        $admin   = $this->adminUser();
        $payload = ['name' => 'Repeat Me', 'country' => 'FR', 'timezone' => 'Europe/Paris', 'student_type' => 'adult'];
        $headers = ['Idempotency-Key' => 'form-2:repeat%20me'];

        foreach (range(1, 2) as $_) {
            $this->actingAs($admin, 'sanctum')
                ->postJson('/api/system/students', $payload, $headers)
                ->assertCreated();
        }

        $this->assertSame(1, Student::where('name', 'Repeat Me')->count());
        $this->assertDatabaseMissing('users', ['email' => 'repeat.me.2@students.alrayanquran.com']);
    }

    public function test_a_repeated_directory_submission_creates_the_student_once(): void
    {
        $admin   = $this->adminUser();
        $payload = ['role' => 'student', 'name' => 'Directory Kid', 'country' => 'FR', 'timezone' => 'Europe/Paris', 'student_type' => 'adult'];
        $headers = ['Idempotency-Key' => 'form-3:directory%20kid'];

        foreach (range(1, 2) as $_) {
            $this->actingAs($admin, 'sanctum')
                ->postJson('/api/system/users/directory', $payload, $headers)
                ->assertCreated();
        }

        $this->assertSame(1, Student::where('name', 'Directory Kid')->count());
    }

    public function test_a_rejected_submission_can_be_fixed_and_resent_under_the_same_key(): void
    {
        $admin   = $this->adminUser();
        $headers = ['Idempotency-Key' => 'form-4:fix%20me'];
        $payload = ['name' => 'Fix Me', 'country' => 'FR', 'timezone' => 'Europe/Paris'];

        // Missing student_type: refused, and the refusal is not what a retry gets back.
        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/system/students', $payload, $headers)
            ->assertStatus(422);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/system/students', $payload + ['student_type' => 'adult'], $headers)
            ->assertCreated();

        $this->assertSame(1, Student::where('name', 'Fix Me')->count());
    }

    public function test_a_key_only_replays_for_the_user_who_sent_it(): void
    {
        $payload = ['name' => 'Same Key', 'country' => 'FR', 'timezone' => 'Europe/Paris', 'student_type' => 'adult'];
        $headers = ['Idempotency-Key' => 'shared'];

        foreach ([$this->adminUser(), $this->adminUser()] as $admin) {
            $this->actingAs($admin, 'sanctum')
                ->postJson('/api/system/students', $payload, $headers)
                ->assertCreated()
                ->assertHeaderMissing('Idempotent-Replayed');
        }

        $this->assertSame(2, Student::where('name', 'Same Key')->count());
    }

    // ---------------------------------------- failure after the commit ---

    public function test_a_failing_teacher_notification_does_not_fail_a_saved_lead(): void
    {
        ['teacher' => $teacher] = $this->teacherUser();

        // The teacher's "new student" notification runs after the commit; make it blow up there.
        Schema::drop('sys_notifications');

        // An error here used to report a failed save that had in fact gone through,
        // and the retry provisioned the student a second time.
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/leads', ['name' => 'Has Teacher', 'assigned_teacher_id' => $teacher->id])
            ->assertCreated();

        $this->assertSame(1, Student::where('name', 'Has Teacher')->count());
    }
}
