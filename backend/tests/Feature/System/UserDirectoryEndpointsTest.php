<?php

namespace Tests\Feature\System;

use App\Models\Course;
use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Models\System\UserEmail;
use App\Models\System\UserPhone;
use App\Models\User;
use App\Services\System\PackageService;
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

    public function test_deleting_a_teacher_with_lessons_purges_them_and_rebuilds_the_student(): void
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
            ->assertJson(['deleted' => true, 'students_unassigned' => 1, 'lessons_deleted' => 1]);

        // Teacher, user and lesson are gone for good; the student survives, unassigned.
        $this->assertDatabaseMissing('users', ['id' => $teacher->user_id]);
        $this->assertDatabaseMissing('sys_teachers', ['id' => $teacher->id]);
        $this->assertDatabaseMissing('sys_lessons', ['id' => $lesson->id]);
        $this->assertNull($student->fresh()->assigned_teacher_id);

        // The purged lesson no longer consumes package hours.
        $this->assertEqualsWithDelta(0.0, $package->fresh()->consumed_hours, 0.001, 'consumption re-derived');
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
        // A soft-deleted lesson is still a physical row: it trips sys_lessons' restrictOnDelete FK
        // unless it is force-deleted. This is what used to make the endpoint 500.
        $lesson->delete();

        $this->asAdmin()
            ->deleteJson("/api/system/users/directory/{$teacher->user_id}")
            ->assertOk()
            ->assertJson(['deleted' => true, 'lessons_deleted' => 1]);

        $this->assertDatabaseMissing('users', ['id' => $teacher->user_id]);
        $this->assertDatabaseMissing('sys_teachers', ['id' => $teacher->id]);
        $this->assertDatabaseMissing('sys_lessons', ['id' => $lesson->id]);
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
