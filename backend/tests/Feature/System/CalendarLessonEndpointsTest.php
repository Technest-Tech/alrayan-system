<?php

namespace Tests\Feature\System;

use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use Tests\SystemTestCase;

class CalendarLessonEndpointsTest extends SystemTestCase
{
    /** Create a student configured so PackageService can build packages. */
    private function lessonStudent(array $overrides = []): Student
    {
        return Student::factory()->create(array_merge([
            'package_hours_default' => 8,
            'hourly_rate_minor'     => 5000,
            'currency'              => 'USD',
        ], $overrides));
    }

    private function makePackage(Student $student, array $overrides = []): StudentPackage
    {
        return StudentPackage::create(array_merge([
            'student_id'     => $student->id,
            'package_number' => 1,
            'package_hours'  => 8,
            'tariff_at_time' => 5000,
            'currency'       => 'USD',
            'status'         => 'pending',
        ], $overrides));
    }

    private function makeLesson(Student $student, Teacher $teacher, StudentPackage $package, array $overrides = []): Lesson
    {
        return Lesson::create(array_merge([
            'package_id'       => $package->id,
            'teacher_id'       => $teacher->id,
            'student_id'       => $student->id,
            'scheduled_at'     => now()->setTime(10, 0),
            'duration_minutes' => 60,
            'status'           => 'scheduled',
        ], $overrides));
    }

    /* ─────────────────────────────  AUTH  ───────────────────────────── */

    public function test_calendar_requires_authentication(): void
    {
        $this->getJson('/api/system/calendar')->assertStatus(401);
    }

    public function test_lessons_index_requires_authentication(): void
    {
        $this->getJson('/api/system/lessons')->assertStatus(401);
    }

    public function test_non_admin_without_permission_is_forbidden(): void
    {
        $this->actingAs($this->staffUser('accountant'), 'sanctum')
            ->getJson('/api/system/calendar')
            ->assertStatus(403);
    }

    /* ─────────────────────────────  CALENDAR  ───────────────────────── */

    public function test_admin_can_load_calendar_feed(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();
        $package = $this->makePackage($student);
        $this->makeLesson($student, $teacher, $package, [
            'scheduled_at' => now()->startOfMonth()->addDays(5)->setTime(10, 0),
        ]);

        $start = now()->startOfMonth()->format('Y-m-d');
        $end   = now()->endOfMonth()->format('Y-m-d');

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/calendar?start={$start}&end={$end}")
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['date', 'lessons' => [['id', 'student', 'teacher', 'package', 'status']]]],
            ]);
    }

    public function test_calendar_groups_lessons_by_date(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();
        $package = $this->makePackage($student);

        $day = now()->startOfMonth()->addDays(3);
        $this->makeLesson($student, $teacher, $package, ['scheduled_at' => $day->copy()->setTime(9, 0)]);
        $this->makeLesson($student, $teacher, $package, ['scheduled_at' => $day->copy()->setTime(11, 0)]);

        $start = now()->startOfMonth()->format('Y-m-d');
        $end   = now()->endOfMonth()->format('Y-m-d');

        $data = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/calendar?start={$start}&end={$end}")
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $data);
        $this->assertCount(2, $data[0]['lessons']);
    }

    public function test_calendar_respects_date_range(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();
        $package = $this->makePackage($student);

        $this->makeLesson($student, $teacher, $package, ['scheduled_at' => now()->setTime(10, 0)]);
        $this->makeLesson($student, $teacher, $package, ['scheduled_at' => now()->addMonths(2)->setTime(10, 0)]);

        $start = now()->startOfMonth()->format('Y-m-d');
        $end   = now()->endOfMonth()->format('Y-m-d');

        $data = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/calendar?start={$start}&end={$end}")
            ->assertOk()
            ->json('data');

        // Only the in-range lesson should appear.
        $total = collect($data)->sum(fn ($d) => count($d['lessons']));
        $this->assertSame(1, $total);
    }

    public function test_calendar_filters_by_teacher(): void
    {
        $teacherA = Teacher::factory()->create();
        $teacherB = Teacher::factory()->create();
        $student  = $this->lessonStudent();
        $package  = $this->makePackage($student);

        $this->makeLesson($student, $teacherA, $package, ['scheduled_at' => now()->setTime(10, 0)]);
        $this->makeLesson($student, $teacherB, $package, ['scheduled_at' => now()->setTime(12, 0)]);

        $start = now()->startOfMonth()->format('Y-m-d');
        $end   = now()->endOfMonth()->format('Y-m-d');

        $data = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/calendar?start={$start}&end={$end}&teacher_id={$teacherA->id}")
            ->assertOk()
            ->json('data');

        $total = collect($data)->sum(fn ($d) => count($d['lessons']));
        $this->assertSame(1, $total);
    }

    public function test_calendar_filters_by_multiple_students(): void
    {
        $teacher  = Teacher::factory()->create();
        $studentA = $this->lessonStudent();
        $studentB = $this->lessonStudent();
        $studentC = $this->lessonStudent();
        $this->makeLesson($studentA, $teacher, $this->makePackage($studentA), ['scheduled_at' => now()->setTime(9, 0)]);
        $this->makeLesson($studentB, $teacher, $this->makePackage($studentB), ['scheduled_at' => now()->setTime(10, 0)]);
        $this->makeLesson($studentC, $teacher, $this->makePackage($studentC), ['scheduled_at' => now()->setTime(11, 0)]);

        $start = now()->startOfMonth()->format('Y-m-d');
        $end   = now()->endOfMonth()->format('Y-m-d');

        $data = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/calendar?start={$start}&end={$end}&student_id[]={$studentA->id}&student_id[]={$studentB->id}")
            ->assertOk()
            ->json('data');

        $total = collect($data)->sum(fn ($d) => count($d['lessons']));
        $this->assertSame(2, $total);
    }

    /* ─────────────────────────────  LESSONS INDEX  ──────────────────── */

    public function test_admin_can_list_lessons_paginated(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();
        $package = $this->makePackage($student);
        $this->makeLesson($student, $teacher, $package);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/lessons')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'total']]);
    }

    public function test_lessons_index_filters_by_status(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();
        $package = $this->makePackage($student);
        $this->makeLesson($student, $teacher, $package, ['status' => 'attended', 'scheduled_at' => now()->setTime(9, 0)]);
        $this->makeLesson($student, $teacher, $package, ['status' => 'cancelled_by_teacher', 'scheduled_at' => now()->setTime(10, 0)]);

        $data = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/lessons?status=attended')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $data);
        $this->assertSame('attended', $data[0]['status']);
    }

    /* ─────────────────────────────  SHOW  ───────────────────────────── */

    public function test_admin_can_show_lesson(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();
        $package = $this->makePackage($student);
        $lesson  = $this->makeLesson($student, $teacher, $package);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson("/api/system/lessons/{$lesson->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $lesson->id);
    }

    /* ─────────────────────────────  STORE  ──────────────────────────── */

    public function test_admin_can_create_lesson_and_package_is_auto_resolved(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();

        $payload = [
            'teacher_id'       => $teacher->id,
            'student_id'       => $student->id,
            'scheduled_at'     => now()->setTime(10, 0)->toDateTimeString(),
            'duration_minutes' => 60,
            'status'           => 'attended', // consuming -> counts toward the package
        ];

        $response = $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/lessons', $payload)
            ->assertCreated();

        $packageId = $response->json('data.package_id');
        $this->assertNotNull($packageId);
        $this->assertDatabaseHas('sys_student_packages', ['id' => $packageId, 'student_id' => $student->id]);
        $this->assertDatabaseHas('sys_lessons', [
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'package_id' => $packageId,
        ]);
        // session_number_hours recalculated -> first 60min lesson = 1.0h
        $this->assertEquals(1.0, $response->json('data.session_number_hours'));
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/lessons', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['teacher_id', 'student_id', 'scheduled_at', 'duration_minutes']);
    }

    public function test_store_rejects_invalid_duration(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();

        $this->actingAs($this->adminUser(), 'sanctum')
            ->postJson('/api/system/lessons', [
                'teacher_id'       => $teacher->id,
                'student_id'       => $student->id,
                'scheduled_at'     => now()->toDateTimeString(),
                'duration_minutes' => 45,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['duration_minutes']);
    }

    public function test_cumulative_session_numbers_across_multiple_lessons(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();
        $admin   = $this->adminUser();

        $this->actingAs($admin, 'sanctum')->postJson('/api/system/lessons', [
            'teacher_id' => $teacher->id, 'student_id' => $student->id,
            'scheduled_at' => now()->setTime(9, 0)->toDateTimeString(), 'duration_minutes' => 60,
            'status' => 'attended',
        ])->assertCreated();

        $second = $this->actingAs($admin, 'sanctum')->postJson('/api/system/lessons', [
            'teacher_id' => $teacher->id, 'student_id' => $student->id,
            'scheduled_at' => now()->setTime(11, 0)->toDateTimeString(), 'duration_minutes' => 90,
            'status' => 'attended',
        ])->assertCreated();

        // Second lesson cumulative = 1.0 + 1.5 = 2.5
        $this->assertEquals(2.5, $second->json('data.session_number_hours'));
    }

    /* ────────────────────────  TEACHER SELF-SCOPING  ─────────────────── */

    public function test_teacher_can_create_lesson_for_own_student(): void
    {
        ['user' => $user, 'teacher' => $teacher] = $this->teacherUser();
        $student = $this->lessonStudent(['assigned_teacher_id' => $teacher->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/system/lessons', [
                'teacher_id'       => $teacher->id,
                'student_id'       => $student->id,
                'scheduled_at'     => now()->setTime(10, 0)->toDateTimeString(),
                'duration_minutes' => 60,
                'status'           => 'scheduled',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('sys_lessons', [
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
        ]);
    }

    public function test_teacher_lesson_is_forced_to_own_teacher_id(): void
    {
        ['user' => $user, 'teacher' => $teacher] = $this->teacherUser();
        $other   = Teacher::factory()->create();
        $student = $this->lessonStudent(['assigned_teacher_id' => $teacher->id]);

        // Even if a teacher spoofs another teacher_id, it's overridden with their own.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/system/lessons', [
                'teacher_id'       => $other->id,
                'student_id'       => $student->id,
                'scheduled_at'     => now()->setTime(12, 0)->toDateTimeString(),
                'duration_minutes' => 60,
                'status'           => 'scheduled',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('sys_lessons', ['student_id' => $student->id, 'teacher_id' => $teacher->id]);
        $this->assertDatabaseMissing('sys_lessons', ['student_id' => $student->id, 'teacher_id' => $other->id]);
    }

    public function test_teacher_cannot_create_lesson_for_another_teachers_student(): void
    {
        ['user' => $user, 'teacher' => $teacher] = $this->teacherUser();
        $other   = Teacher::factory()->create();
        $student = $this->lessonStudent(['assigned_teacher_id' => $other->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/system/lessons', [
                'teacher_id'       => $teacher->id,
                'student_id'       => $student->id,
                'scheduled_at'     => now()->setTime(10, 0)->toDateTimeString(),
                'duration_minutes' => 60,
                'status'           => 'scheduled',
            ])
            ->assertStatus(403);
    }

    public function test_teacher_cannot_edit_another_teachers_lesson(): void
    {
        ['user' => $user] = $this->teacherUser();
        $other   = Teacher::factory()->create();
        $student = $this->lessonStudent(['assigned_teacher_id' => $other->id]);
        $package = $this->makePackage($student);
        $lesson  = $this->makeLesson($student, $other, $package);

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/system/lessons/{$lesson->id}", ['status' => 'attended'])
            ->assertStatus(403);
    }

    /* ─────────────────────────────  UPDATE  ─────────────────────────── */

    public function test_admin_can_update_lesson(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();
        $package = $this->makePackage($student);
        $lesson  = $this->makeLesson($student, $teacher, $package);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->putJson("/api/system/lessons/{$lesson->id}", [
                'status' => 'attended',
                'notes'  => 'Great progress',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'attended')
            ->assertJsonPath('data.notes', 'Great progress');

        $this->assertDatabaseHas('sys_lessons', ['id' => $lesson->id, 'status' => 'attended']);
    }

    public function test_update_rejects_invalid_status(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();
        $package = $this->makePackage($student);
        $lesson  = $this->makeLesson($student, $teacher, $package);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->patchJson("/api/system/lessons/{$lesson->id}", ['status' => 'bogus'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /* ─────────────────────────────  DELETE  ─────────────────────────── */

    public function test_admin_can_delete_lesson(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();
        $package = $this->makePackage($student);
        $lesson  = $this->makeLesson($student, $teacher, $package);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->deleteJson("/api/system/lessons/{$lesson->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('sys_lessons', ['id' => $lesson->id]);
    }

    public function test_delete_recalculates_remaining_session_numbers(): void
    {
        $teacher = Teacher::factory()->create();
        $student = $this->lessonStudent();
        $package = $this->makePackage($student);

        $l1 = $this->makeLesson($student, $teacher, $package, ['status' => 'attended', 'scheduled_at' => now()->setTime(9, 0), 'duration_minutes' => 60, 'session_number_hours' => 1.0]);
        $l2 = $this->makeLesson($student, $teacher, $package, ['status' => 'attended', 'scheduled_at' => now()->setTime(11, 0), 'duration_minutes' => 60, 'session_number_hours' => 2.0]);

        $this->actingAs($this->adminUser(), 'sanctum')
            ->deleteJson("/api/system/lessons/{$l1->id}")
            ->assertNoContent();

        // l2 becomes the only lesson -> cumulative 1.0
        $this->assertEquals(1.0, $l2->fresh()->session_number_hours);
    }

    /* ────────────────  Archived teacher / student still label lessons  ──────────────── */

    public function test_lessons_index_still_names_an_archived_teacher_and_student(): void
    {
        $student = $this->lessonStudent();
        $teacher = Teacher::factory()->create();
        $this->makeLesson($student, $teacher, $this->makePackage($student));

        // Archiving soft-deletes the profiles; the lesson must keep its labels.
        $teacher->delete();
        $student->delete();

        $row = $this->actingAs($this->adminUser(), 'sanctum')
            ->getJson('/api/system/lessons')
            ->assertOk()
            ->json('data.0');

        $this->assertNotNull($row['teacher'], 'archived teacher still resolves');
        $this->assertNotNull($row['student'], 'archived student still resolves');
        $this->assertSame($teacher->user->name, $row['teacher']['name']);
        $this->assertSame($student->name, $row['student']['name']);
    }
}
