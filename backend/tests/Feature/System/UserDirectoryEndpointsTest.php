<?php

namespace Tests\Feature\System;

use App\Models\Course;
use App\Models\System\Guardian;
use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Models\System\UserEmail;
use App\Models\System\UserPhone;
use App\Models\User;
use App\Services\System\PackageService;
use Illuminate\Support\Facades\DB;
use Tests\SystemTestCase;

class UserDirectoryEndpointsTest extends SystemTestCase
{
    public function test_admin_can_list_user_directory(): void
    {
        Student::factory()->withUser()->count(2)->create();
        Teacher::factory()->create();

        $this->asAdmin()
            ->getJson('/api/system/users/directory')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'role', 'status', 'profile']],
                'meta' => ['current_page', 'last_page', 'total'],
            ]);
    }

    public function test_directory_filters_by_role(): void
    {
        Student::factory()->withUser()->create();
        Teacher::factory()->create();

        $data = $this->asAdmin()
            ->getJson('/api/system/users/directory?filter[role]=student')
            ->assertOk()
            ->json('data');

        $this->assertNotEmpty($data);
        $this->assertSame(['student'], collect($data)->pluck('role')->unique()->values()->all());
    }

    public function test_directory_filters_by_status(): void
    {
        User::factory()->student()->create(['status' => 'suspended', 'is_active' => false]);
        User::factory()->student()->create(['status' => 'active']);

        $data = $this->asAdmin()
            ->getJson('/api/system/users/directory?filter[status]=suspended')
            ->assertOk()
            ->json('data');

        $this->assertSame(['suspended'], collect($data)->pluck('status')->unique()->values()->all());
    }

    public function test_directory_filters_by_language(): void
    {
        User::factory()->staff('supervisor')->create(['language' => 'ar']);
        User::factory()->staff('supervisor')->create(['language' => 'en']);

        $data = $this->asAdmin()
            ->getJson('/api/system/users/directory?filter[language]=ar')
            ->assertOk()
            ->json('data');

        $this->assertSame(['ar'], collect($data)->pluck('language')->unique()->values()->all());
    }

    public function test_directory_filters_by_activity_within_30_days(): void
    {
        $recent = User::factory()->staff('supervisor')->create(['last_login_at' => now()->subDays(3)]);
        User::factory()->staff('supervisor')->create(['last_login_at' => now()->subDays(90)]);

        $ids = collect($this->asAdmin()
            ->getJson('/api/system/users/directory?filter[activity]=30')
            ->assertOk()
            ->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($recent->id));
        $this->assertCount(1, $ids);
    }

    public function test_directory_filters_by_assigned_teacher(): void
    {
        $teacher = Teacher::factory()->create();
        $other   = Teacher::factory()->create();

        Student::factory()->withUser()->create(['assigned_teacher_id' => $teacher->id]);
        Student::factory()->withUser()->create(['assigned_teacher_id' => $other->id]);

        $data = $this->asAdmin()
            ->getJson("/api/system/users/directory?filter[assigned_teacher]={$teacher->id}")
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $data);
        $this->assertSame($teacher->id, $data[0]['profile']['assigned_teacher']['id']);
    }

    public function test_directory_filters_by_course(): void
    {
        $course = $this->makeCourse();
        Student::factory()->withUser()->create(['course_id' => $course->id]);
        Student::factory()->withUser()->create(['course_id' => null]);

        $data = $this->asAdmin()
            ->getJson("/api/system/users/directory?filter[course]={$course->id}")
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $data);
    }

    public function test_directory_search_matches_secondary_email_and_phone(): void
    {
        $user = User::factory()->staff('supervisor')->create(['name' => 'Primary Name']);
        UserEmail::create(['user_id' => $user->id, 'email' => 'hidden.alias@example.com']);
        UserPhone::create(['user_id' => $user->id, 'phone' => '+15557778888']);

        $byEmail = $this->asAdmin()
            ->getJson('/api/system/users/directory?filter[q]=hidden.alias')
            ->assertOk()->json('data');
        $this->assertTrue(collect($byEmail)->pluck('id')->contains($user->id));

        $byPhone = $this->asAdmin()
            ->getJson('/api/system/users/directory?filter[q]=5557778888')
            ->assertOk()->json('data');
        $this->assertTrue(collect($byPhone)->pluck('id')->contains($user->id));
    }

    public function test_stats_returns_role_and_status_counts(): void
    {
        Student::factory()->withUser()->count(2)->create();
        Teacher::factory()->create();
        User::factory()->parent()->create();
        User::factory()->staff('accountant')->create();

        $this->asAdmin()
            ->getJson('/api/system/users/directory/stats')
            ->assertOk()
            ->assertJsonStructure(['total', 'students', 'teachers', 'parents', 'staff', 'active', 'inactive', 'suspended', 'archived'])
            ->assertJsonPath('students', 2)
            ->assertJsonPath('teachers', 1)
            ->assertJsonPath('parents', 1);
    }

    /* ── Editing a user ── */

    /**
     * The edit dialog posts the primary contact as `email`/`whatsapp` and only the
     * *extra* ones in `emails`/`phones` — which for a single-contact user means both
     * arrays are empty. That must still land.
     */
    public function test_editing_a_users_email_and_phone_persists(): void
    {
        $user = User::factory()->staff('supervisor')->create([
            'name'     => 'Old Name',
            'email'    => 'old@example.com',
            'whatsapp' => '+201111111111',
        ]);

        $this->asAdmin()
            ->patchJson("/api/system/users/directory/{$user->id}", [
                'role'     => 'supervisor',
                'name'     => 'New Name',
                'email'    => 'new@example.com',
                'emails'   => [],
                'whatsapp' => '+202222222222',
                'phones'   => [],
                'status'   => 'active',
            ])
            ->assertOk()
            ->assertJsonPath('data.email', 'new@example.com')
            ->assertJsonPath('data.whatsapp', '+202222222222');

        $user->refresh();
        $this->assertSame('New Name', $user->name);
        $this->assertSame('new@example.com', $user->email);
        $this->assertSame('+202222222222', $user->whatsapp);

        // The primary must survive as a contact row, not be wiped by the replace.
        $this->assertSame(['new@example.com'], $user->emails()->pluck('email')->all());
        $this->assertSame(['+202222222222'], $user->phones()->pluck('phone')->all());
    }

    public function test_editing_keeps_extra_contacts_as_secondary(): void
    {
        $user = User::factory()->staff('supervisor')->create(['email' => 'old@example.com']);

        $this->asAdmin()
            ->patchJson("/api/system/users/directory/{$user->id}", [
                'email'    => 'primary@example.com',
                'emails'   => ['second@example.com'],
                'whatsapp' => '+201111111111',
                'phones'   => ['+202222222222'],
            ])
            ->assertOk();

        $user->refresh();
        $this->assertSame('primary@example.com', $user->email);
        $this->assertTrue($user->emails()->where('email', 'primary@example.com')->where('is_primary', true)->exists());
        $this->assertTrue($user->emails()->where('email', 'second@example.com')->where('is_primary', false)->exists());
        $this->assertTrue($user->phones()->where('phone', '+201111111111')->where('is_primary', true)->exists());
        $this->assertTrue($user->phones()->where('phone', '+202222222222')->where('is_primary', false)->exists());
    }

    /** sys_students carries its own contact copy — the WhatsApp report reads that one. */
    public function test_editing_a_student_mirrors_contacts_onto_the_student_profile(): void
    {
        $student = Student::factory()->withUser()->create([
            'whatsapp' => '+201111111111',
            'email'    => 'old@example.com',
        ]);

        $this->asAdmin()
            ->patchJson("/api/system/users/directory/{$student->user_id}", [
                'name'     => 'Renamed Student',
                'email'    => 'new@example.com',
                'emails'   => [],
                'whatsapp' => '+209999999999',
                'phones'   => [],
            ])
            ->assertOk();

        $student->refresh();
        $this->assertSame('Renamed Student', $student->name);
        $this->assertSame('new@example.com', $student->email);
        $this->assertSame('+209999999999', $student->whatsapp);
    }

    /**
     * The form posts an empty tariff / session box as null, but those columns are
     * NOT NULL with a 0 default — this used to blow the whole save up with an
     * integrity-constraint violation (seen in production).
     */
    public function test_editing_a_student_with_empty_tariff_fields_does_not_fail(): void
    {
        $student = Student::factory()->withUser()->create([
            'monthly_price_minor' => 5000,
            'sessions_per_month'  => 8,
        ]);

        $this->asAdmin()
            ->patchJson("/api/system/users/directory/{$student->user_id}", [
                'name'                  => 'Kept Student',
                'email'                 => 'kept@example.com',
                'emails'                => [],
                'whatsapp'              => '+201111111111',
                'phones'                => [],
                'monthly_price_minor'   => null,
                'hourly_rate_minor'     => null,
                'sessions_per_month'    => null,
                'package_hours_default' => null,
            ])
            ->assertOk();

        $student->refresh();
        $this->assertSame(0, $student->monthly_price_minor);
        $this->assertSame(0, $student->sessions_per_month);
        $this->assertSame('Kept Student', $student->name);
    }

    /** sys_guardians mirrors the name/number too — but has no email column to write to. */
    public function test_editing_a_parent_mirrors_contacts_onto_the_guardian_profile(): void
    {
        $user     = User::factory()->parent()->create();
        $guardian = Guardian::create([
            'user_id'  => $user->id,
            'name'     => 'Old Parent',
            'whatsapp' => '+201111111111',
        ]);

        $this->asAdmin()
            ->patchJson("/api/system/users/directory/{$user->id}", [
                'name'     => 'New Parent',
                'email'    => 'parent@example.com',
                'emails'   => [],
                'whatsapp' => '+209999999999',
                'phones'   => [],
            ])
            ->assertOk();

        $guardian->refresh();
        $this->assertSame('New Parent', $guardian->name);
        $this->assertSame('+209999999999', $guardian->whatsapp);
    }

    public function test_editing_the_status_keeps_the_is_active_mirror_in_sync(): void
    {
        $user = User::factory()->staff('supervisor')->create(['status' => 'active', 'is_active' => true]);

        $this->asAdmin()
            ->patchJson("/api/system/users/directory/{$user->id}", ['status' => 'suspended'])
            ->assertOk();

        $user->refresh();
        $this->assertSame('suspended', $user->status);
        $this->assertFalse($user->is_active);
    }

    public function test_teacher_cannot_access_directory(): void
    {
        $this->asTeacher()
            ->getJson('/api/system/users/directory')
            ->assertForbidden();
    }

    public function test_guest_cannot_access_directory(): void
    {
        $this->getJson('/api/system/users/directory')->assertUnauthorized();
    }

    /* ── Deleting a teacher ── */

    public function test_deleting_a_teacher_without_history_unassigns_students_and_removes_them(): void
    {
        $teacher = Teacher::factory()->create();
        $student = Student::factory()->withUser()->create(['assigned_teacher_id' => $teacher->id]);

        $this->asAdmin()
            ->deleteJson("/api/system/users/directory/{$teacher->user_id}")
            ->assertOk()
            ->assertJson(['deleted' => true, 'students_unassigned' => 1]);

        $this->assertNull($student->fresh()->assigned_teacher_id, 'student is unassigned, not deleted');
        $this->assertDatabaseMissing('users', ['id' => $teacher->user_id]);
        $this->assertDatabaseMissing('sys_teachers', ['id' => $teacher->id]);
    }

    public function test_deleting_a_teacher_keeps_lessons_and_packages_and_only_unlinks_them(): void
    {
        $teacher = Teacher::factory()->create();
        $student = Student::factory()->withUser()->create([
            'assigned_teacher_id'   => $teacher->id,
            'package_hours_default' => 2,
            'hourly_rate_minor'     => 5000,
            'currency'              => 'USD',
        ]);

        $package = app(PackageService::class)->resolvePackageForLesson($student);
        $lesson  = Lesson::create([
            'package_id'       => $package->id,
            'teacher_id'       => $teacher->id,
            'student_id'       => $student->id,
            'scheduled_at'     => now(),
            'duration_minutes' => 60,
            'status'           => 'attended',
        ]);
        app(PackageService::class)->rebuild($student);
        $this->assertEqualsWithDelta(1.0, $package->fresh()->consumed_hours, 0.001);

        $this->asAdmin()
            ->deleteJson("/api/system/users/directory/{$teacher->user_id}")
            ->assertOk()
            ->assertJson(['deleted' => true, 'students_unassigned' => 1]);

        // The teacher is gone for good.
        $this->assertDatabaseMissing('users', ['id' => $teacher->user_id]);
        $this->assertDatabaseMissing('sys_teachers', ['id' => $teacher->id]);

        // Everything else survives; the lesson merely loses its teacher.
        $this->assertDatabaseHas('sys_lessons', ['id' => $lesson->id, 'teacher_id' => null]);
        $this->assertNotNull($student->fresh(), 'student is kept');
        $this->assertNull($student->fresh()->assigned_teacher_id, 'student is unassigned');
        $this->assertEqualsWithDelta(1.0, $package->fresh()->consumed_hours, 0.001, 'consumption untouched');
    }

    public function test_a_soft_deleted_lesson_does_not_block_deleting_the_teacher(): void
    {
        $teacher = Teacher::factory()->create();
        $student = Student::factory()->withUser()->create([
            'assigned_teacher_id'   => $teacher->id,
            'package_hours_default' => 2,
            'hourly_rate_minor'     => 5000,
            'currency'              => 'USD',
        ]);

        $package = app(PackageService::class)->resolvePackageForLesson($student);
        $lesson  = Lesson::create([
            'package_id'       => $package->id,
            'teacher_id'       => $teacher->id,
            'student_id'       => $student->id,
            'scheduled_at'     => now(),
            'duration_minutes' => 60,
            'status'           => 'attended',
        ]);
        // A soft-deleted lesson is still a physical row — it used to hold the restrictOnDelete FK.
        $lesson->delete();

        $this->asAdmin()
            ->deleteJson("/api/system/users/directory/{$teacher->user_id}")
            ->assertOk()
            ->assertJson(['deleted' => true]);

        $this->assertDatabaseMissing('sys_teachers', ['id' => $teacher->id]);
        $this->assertDatabaseHas('sys_lessons', ['id' => $lesson->id, 'teacher_id' => null]);
    }

    public function test_deleting_a_teacher_keeps_payroll_but_drops_their_own_records(): void
    {
        $teacher = Teacher::factory()->create();

        $payrollId = DB::table('sys_payrolls')->insertGetId([
            'teacher_id'            => $teacher->id,
            'period_year'           => 2026,
            'period_month'          => 7,
            'total_sessions'        => 4,
            'total_minutes'         => 240,
            'breakdown_by_duration' => json_encode([]),
            'base_salary_minor'     => 100000,
            'net_salary_minor'      => 100000,
            'status'                => 'pending',
            'created_at'            => now(),
            'updated_at'            => now(),
        ]);

        $reviewId = DB::table('sys_quality_reviews')->insertGetId([
            'teacher_id'        => $teacher->id,
            'period_year'       => 2026,
            'period_month'      => 7,
            'source'            => 'manual',
            'attendance_score'  => 8,
            'reports_score'     => 8,
            'retention_score'   => 8,
            'punctuality_score' => 8,
            'overall_score'     => 8,
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);

        $this->asAdmin()
            ->deleteJson("/api/system/users/directory/{$teacher->user_id}")
            ->assertOk()
            ->assertJson(['deleted' => true]);

        // Payroll is money — kept, just unlinked. Quality review belongs to the teacher — removed.
        $this->assertDatabaseHas('sys_payrolls', ['id' => $payrollId, 'teacher_id' => null]);
        $this->assertDatabaseMissing('sys_quality_reviews', ['id' => $reviewId]);
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
}
