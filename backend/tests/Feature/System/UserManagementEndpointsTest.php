<?php

namespace Tests\Feature\System;

use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Models\User;
use App\Notifications\System\SystemUserInvitedNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\SystemTestCase;

class UserManagementEndpointsTest extends SystemTestCase
{
    private const ENDPOINT = '/api/system/users/directory';

    /** actingAs(..., 'sanctum') makes sanctum the default guard, which has no attempt(). */
    private function assertCanLogIn(string $email, string $password): void
    {
        $this->app['auth']->shouldUse('web');

        $this->postJson('/api/system/auth/login', compact('email', 'password'))->assertOk();
    }

    public function test_admin_can_create_student_user_with_profile_and_contacts(): void
    {
        $this->asAdmin()
            ->postJson(self::ENDPOINT, [
                'role'         => 'student',
                'name'         => 'Aisha Student',
                'whatsapp'     => '+15551112222',
                'country'      => 'EG',
                'timezone'     => 'Africa/Cairo',
                'student_type' => 'adult',
                'emails'       => ['aisha.alt@example.com'],
            ])
            ->assertCreated()
            ->assertJsonPath('data.role', 'student')
            ->assertJsonPath('data.profile.country', 'EG');

        $user = User::where('role', 'student')->where('name', 'Aisha Student')->firstOrFail();
        $this->assertDatabaseHas('sys_students', ['user_id' => $user->id, 'country' => 'EG']);
        $this->assertDatabaseHas('sys_user_emails', ['user_id' => $user->id, 'is_primary' => true]);
        $this->assertDatabaseHas('sys_user_phones', ['user_id' => $user->id]);
    }

    public function test_create_child_student_creates_guardian_and_parent_user(): void
    {
        $this->asAdmin()
            ->postJson(self::ENDPOINT, [
                'role'              => 'student',
                'name'              => 'Yusuf Child',
                'country'           => 'EG',
                'timezone'          => 'Africa/Cairo',
                'student_type'      => 'child',
                'guardian_name'     => 'Parent Of Yusuf',
                'guardian_whatsapp' => '+15553334444',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('users', ['role' => 'parent', 'name' => 'Parent Of Yusuf']);
        $parent = User::where('role', 'parent')->firstOrFail();
        $this->assertDatabaseHas('sys_guardians', ['user_id' => $parent->id]);

        $student = Student::where('name', 'Yusuf Child')->firstOrFail();
        $this->assertNotNull($student->guardian_id);
    }

    public function test_teacher_created_by_admin_can_log_in_with_the_given_password(): void
    {
        Notification::fake();

        $this->asAdmin()
            ->postJson(self::ENDPOINT, [
                'role'           => 'teacher',
                'name'           => 'Omar Teacher',
                'email'          => 'omar.teacher@example.com',
                'password'       => 'secret-pass-123',
                'payment_method' => 'instapay',
                'hourly_rate'    => 300,
            ])
            ->assertCreated()
            ->assertJsonPath('data.role', 'teacher');

        $user = User::where('email', 'omar.teacher@example.com')->firstOrFail();
        $this->assertDatabaseHas('sys_teachers', ['user_id' => $user->id, 'per_minute_rate_30' => 5]);

        // No invite: the admin set the password, so the teacher signs in immediately.
        Notification::assertNothingSent();
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'omar.teacher@example.com']);

        $this->assertTrue(Hash::check('secret-pass-123', $user->password), 'stored password is the admin-set one');
        $this->assertCanLogIn('omar.teacher@example.com', 'secret-pass-123');
    }

    public function test_creating_a_login_role_without_a_password_is_rejected(): void
    {
        $this->asAdmin()
            ->postJson(self::ENDPOINT, [
                'role'           => 'teacher',
                'name'           => 'No Password',
                'email'          => 'nopass@example.com',
                'payment_method' => 'instapay',
                'hourly_rate'    => 300,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_admin_can_reset_an_existing_users_password(): void
    {
        $teacher = Teacher::factory()->create();

        $this->asAdmin()
            ->patchJson(self::ENDPOINT . "/{$teacher->user_id}", ['password' => 'brand-new-pass'])
            ->assertOk();

        $this->assertCanLogIn($teacher->user->email, 'brand-new-pass');
    }

    public function test_admin_can_create_parent_user(): void
    {
        $this->asAdmin()
            ->postJson(self::ENDPOINT, [
                'role'     => 'parent',
                'name'     => 'Standalone Parent',
                'whatsapp' => '+15556667777',
            ])
            ->assertCreated()
            ->assertJsonPath('data.role', 'parent');

        $this->assertDatabaseHas('sys_guardians', ['name' => 'Standalone Parent']);
    }

    public function test_admin_can_create_staff_user_with_permissions(): void
    {
        Notification::fake();

        $this->asAdmin()
            ->postJson(self::ENDPOINT, [
                'role'        => 'accountant',
                'name'        => 'Finance Person',
                'email'       => 'finance@example.com',
                'password'    => 'accountant-pass-1',
                'permissions' => ['invoices.view', 'payments.view'],
            ])
            ->assertCreated();

        $user = User::where('email', 'finance@example.com')->firstOrFail();
        $this->assertTrue($user->hasRole('accountant'));
        $this->assertTrue($user->hasPermissionTo('invoices.view'));
    }

    public function test_create_validates_role_in_allowed_list(): void
    {
        $this->asAdmin()
            ->postJson(self::ENDPOINT, ['role' => 'wizard', 'name' => 'X'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['role']);
    }

    public function test_create_student_requires_country_and_timezone(): void
    {
        $this->asAdmin()
            ->postJson(self::ENDPOINT, ['role' => 'student', 'name' => 'No Location'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['country', 'timezone', 'student_type']);
    }

    public function test_create_staff_requires_email(): void
    {
        $this->asAdmin()
            ->postJson(self::ENDPOINT, ['role' => 'supervisor', 'name' => 'No Email'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_patch_updates_shared_identity_fields(): void
    {
        $user = User::factory()->staff('supervisor')->create();

        $this->asAdmin()
            ->patchJson(self::ENDPOINT . "/{$user->id}", [
                'name'     => 'Renamed Person',
                'language' => 'ar',
                'gender'   => 'female',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Renamed Person')
            ->assertJsonPath('data.language', 'ar');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Renamed Person', 'gender' => 'female']);
    }

    public function test_patch_replaces_emails(): void
    {
        $user = User::factory()->staff('supervisor')->create();
        $user->emails()->create(['email' => 'old@example.com', 'is_primary' => true]);

        $this->asAdmin()
            ->patchJson(self::ENDPOINT . "/{$user->id}", [
                'emails' => ['new-primary@example.com', 'extra@example.com'],
            ])
            ->assertOk();

        $this->assertDatabaseMissing('sys_user_emails', ['user_id' => $user->id, 'email' => 'old@example.com']);
        $this->assertDatabaseHas('sys_user_emails', ['user_id' => $user->id, 'email' => 'new-primary@example.com']);
    }

    public function test_admin_can_create_student_with_package_and_tariff_fields(): void
    {
        $this->asAdmin()
            ->postJson(self::ENDPOINT, [
                'role'                  => 'student',
                'name'                  => 'Packaged Student',
                'country'               => 'EG',
                'timezone'              => 'Africa/Cairo',
                'student_type'          => 'adult',
                'currency'              => 'EUR',
                'monthly_price_minor'   => 4000,
                'package_hours_default' => 4,
                'hourly_rate_minor'     => 1500,
                'sessions_per_month'    => 8,
            ])
            ->assertCreated();

        $student = Student::where('name', 'Packaged Student')->firstOrFail();
        $this->assertDatabaseHas('sys_students', [
            'id'                    => $student->id,
            'currency'              => 'EUR',
            'monthly_price_minor'   => 4000,
            'package_hours_default' => 4,
            'hourly_rate_minor'     => 1500,
        ]);
        $this->assertDatabaseHas('sys_student_packages', [
            'student_id'     => $student->id,
            'package_number' => 0,
            'package_hours'  => 4,
            'tariff_at_time' => 4000,
            'currency'       => 'EUR',
            'status'         => 'paid',
        ]);
    }

    public function test_patch_persists_student_profile_changes(): void
    {
        $student = Student::factory()->withUser()->create(['monthly_price_minor' => 1000]);

        $this->asAdmin()
            ->patchJson(self::ENDPOINT . "/{$student->user_id}", [
                'monthly_price_minor'   => 5500,
                'package_hours_default' => 6,
                'hourly_rate_minor'     => 2000,
                'sessions_per_month'    => 12,
            ])
            ->assertOk();

        $this->assertDatabaseHas('sys_students', [
            'id'                    => $student->id,
            'monthly_price_minor'   => 5500,
            'package_hours_default' => 6,
            'hourly_rate_minor'     => 2000,
            'sessions_per_month'    => 12,
        ]);
    }

    public function test_patch_persists_teacher_profile_changes(): void
    {
        $teacher = Teacher::factory()->create(['payment_method' => 'instapay']);

        $this->asAdmin()
            ->patchJson(self::ENDPOINT . "/{$teacher->user_id}", [
                'payment_method' => 'vodafone_cash',
                'hourly_rate'    => 600,
            ])
            ->assertOk();

        $this->assertDatabaseHas('sys_teachers', [
            'id'                 => $teacher->id,
            'payment_method'     => 'vodafone_cash',
            'hourly_rate'        => 600,
            'per_minute_rate_30' => 10,
        ]);
    }

    public function test_role_change_syncs_spatie_and_column(): void
    {
        $user = User::factory()->staff('supervisor')->create();

        $this->asAdmin()
            ->patchJson(self::ENDPOINT . "/{$user->id}", ['role' => 'quality'])
            ->assertOk()
            ->assertJsonPath('data.role', 'quality');

        $user->refresh();
        $this->assertSame('quality', $user->role);
        $this->assertTrue($user->hasRole('quality'));
        $this->assertFalse($user->hasRole('supervisor'));
    }

    public function test_status_transitions_mirror_is_active(): void
    {
        $user = User::factory()->staff('supervisor')->create();

        $this->asAdmin()->postJson(self::ENDPOINT . "/{$user->id}/suspend")->assertOk();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'suspended', 'is_active' => false]);

        $this->asAdmin()->postJson(self::ENDPOINT . "/{$user->id}/archive")->assertOk();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'archived']);

        $this->asAdmin()->postJson(self::ENDPOINT . "/{$user->id}/activate")->assertOk();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'active', 'is_active' => true]);
    }

    public function test_cannot_suspend_self(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin, 'sanctum')
            ->postJson(self::ENDPOINT . "/{$admin->id}/suspend")
            ->assertUnprocessable();
    }

    public function test_cannot_suspend_teacher_with_assigned_students(): void
    {
        $teacher = Teacher::factory()->create();
        Student::factory()->withUser()->create(['assigned_teacher_id' => $teacher->id]);

        $this->asAdmin()
            ->postJson(self::ENDPOINT . "/{$teacher->user_id}/suspend")
            ->assertUnprocessable();
    }

    public function test_suspended_user_is_blocked_by_system_active_middleware(): void
    {
        $user = User::factory()->staff('supervisor')->create(['status' => 'suspended', 'is_active' => false]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/dashboard')
            ->assertForbidden();
    }

    public function test_admin_can_delete_a_parent_user(): void
    {
        $parent = User::factory()->parent()->create();

        $this->asAdmin()
            ->deleteJson(self::ENDPOINT . "/{$parent->id}")
            ->assertOk()
            ->assertJson(['deleted' => true]);

        $this->assertDatabaseMissing('users', ['id' => $parent->id]);
    }

    public function test_deleting_a_student_user_soft_deletes_the_student_profile(): void
    {
        $student = Student::factory()->withUser()->create();

        $this->asAdmin()
            ->deleteJson(self::ENDPOINT . "/{$student->user_id}")
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $student->user_id]);
        $this->assertSoftDeleted('sys_students', ['id' => $student->id]);
    }

    public function test_cannot_delete_self(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson(self::ENDPOINT . "/{$admin->id}")
            ->assertUnprocessable();
    }

    public function test_deleting_teacher_with_assigned_students_unassigns_them(): void
    {
        $teacher = Teacher::factory()->create();
        $student = Student::factory()->withUser()->create(['assigned_teacher_id' => $teacher->id]);

        $this->asAdmin()
            ->deleteJson(self::ENDPOINT . "/{$teacher->user_id}")
            ->assertOk()
            ->assertJson(['deleted' => true, 'students_unassigned' => 1]);

        // The students outlive the teacher — unassigned, never cascaded away.
        $this->assertNull($student->fresh()->assigned_teacher_id);
    }

    public function test_supervisor_without_create_permission_cannot_create_user(): void
    {
        // A supervisor by default has users.view_directory but not users.create.
        $supervisor = $this->staffUser('supervisor');

        $this->actingAs($supervisor, 'sanctum')
            ->postJson(self::ENDPOINT, ['role' => 'parent', 'name' => 'Nope'])
            ->assertForbidden();
    }
}
