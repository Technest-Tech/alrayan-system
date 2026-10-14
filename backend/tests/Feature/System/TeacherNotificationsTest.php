<?php

namespace Tests\Feature\System;

use App\Models\System\Lead;
use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\SysNotification;
use App\Models\System\Teacher;
use App\Models\User;
use App\Services\System\LeadToStudentConverter;
use App\Services\System\PackageService;
use App\Support\System\NotificationTypes;
use Tests\SystemTestCase;

class TeacherNotificationsTest extends SystemTestCase
{
    private Teacher $teacher;
    private User $teacherUser;

    protected function setUp(): void
    {
        parent::setUp();
        ['teacher' => $this->teacher, 'user' => $this->teacherUser] = $this->teacherUser();
    }

    private function student(array $overrides = []): Student
    {
        return Student::factory()->create(array_merge([
            'assigned_teacher_id'   => $this->teacher->id,
            'package_hours_default' => 2,
            'hourly_rate_minor'     => 5000,
            'currency'              => 'USD',
        ], $overrides));
    }

    private function attendedLesson(Student $student, int $minutes, $at): Lesson
    {
        $pkg = app(PackageService::class)->resolvePackageForLesson($student);

        $lesson = Lesson::create([
            'package_id'       => $pkg->id,
            'teacher_id'       => $this->teacher->id,
            'student_id'       => $student->id,
            'scheduled_at'     => $at,
            'duration_minutes' => $minutes,
            'status'           => 'attended',
        ]);
        app(PackageService::class)->rebuild($student);

        return $lesson;
    }

    private function inbox(string $type)
    {
        return SysNotification::where('user_id', $this->teacherUser->id)->where('type', $type)->get();
    }

    /* ── Student assigned ── */

    public function test_teacher_is_notified_when_a_student_is_created_for_them(): void
    {
        $student = $this->student(['name' => 'Youssouf Timera', 'package_hours_default' => 6]);

        $rows = $this->inbox(NotificationTypes::TEACHER_STUDENT_ASSIGNED);
        $this->assertCount(1, $rows);
        $this->assertSame('Youssouf Timera', $rows[0]->payload['student_name']);
        $this->assertSame(6, $rows[0]->payload['package_hours']);
        $this->assertSame("/teacher/students?student={$student->id}", $rows[0]->link);
    }

    public function test_reassigning_a_student_notifies_the_new_teacher_only(): void
    {
        ['teacher' => $other, 'user' => $otherUser] = $this->teacherUser();
        $student = $this->student();

        $student->update(['assigned_teacher_id' => $other->id]);

        $this->assertCount(1, SysNotification::where('user_id', $otherUser->id)
            ->where('type', NotificationTypes::TEACHER_STUDENT_ASSIGNED)->get());
        // The original teacher only has the notification from when the student was created.
        $this->assertCount(1, $this->inbox(NotificationTypes::TEACHER_STUDENT_ASSIGNED));
    }

    public function test_assignment_reports_the_hours_of_the_students_current_package(): void
    {
        $student = Student::factory()->create(['package_hours_default' => 2]);
        StudentPackage::create([
            'student_id' => $student->id, 'package_number' => 0, 'package_hours' => 10,
            'tariff_at_time' => 0, 'currency' => 'USD', 'status' => 'paid', 'paid_at' => now(),
        ]);

        $student->update(['assigned_teacher_id' => $this->teacher->id]);

        $this->assertSame(10, $this->inbox(NotificationTypes::TEACHER_STUDENT_ASSIGNED)[0]->payload['package_hours']);
    }

    /* ── Package completed ── */

    public function test_teacher_is_notified_once_when_a_package_runs_out(): void
    {
        $student = $this->student(['package_hours_default' => 2]);

        $this->attendedLesson($student, 60, now()->subDays(3));
        $this->assertCount(0, $this->inbox(NotificationTypes::TEACHER_PACKAGE_COMPLETED));

        $this->attendedLesson($student, 60, now()->subDays(2));
        $rows = $this->inbox(NotificationTypes::TEACHER_PACKAGE_COMPLETED);
        $this->assertCount(1, $rows);
        $this->assertSame(0, $rows[0]->payload['package_number']);
        $this->assertSame(2, $rows[0]->payload['package_hours']);

        // Later edits re-detect the full package; the teacher must not hear about it again.
        $this->attendedLesson($student, 30, now()->subDay());
        $this->assertCount(1, $this->inbox(NotificationTypes::TEACHER_PACKAGE_COMPLETED));
    }

    public function test_a_package_that_was_already_full_does_not_notify_on_later_rebuilds(): void
    {
        $student = $this->student(['package_hours_default' => 1]);
        $this->attendedLesson($student, 60, now()->subDays(3));
        // Simulate a package that filled up before this feature existed.
        SysNotification::query()->delete();

        $this->attendedLesson($student, 30, now()->subDay());

        $this->assertCount(0, $this->inbox(NotificationTypes::TEACHER_PACKAGE_COMPLETED));
    }

    public function test_paid_packages_running_out_also_notify(): void
    {
        $student = $this->student(['package_hours_default' => 1]);
        $this->attendedLesson($student, 60, now()->subDays(5)); // fills #0
        $this->attendedLesson($student, 30, now()->subDays(4)); // opens #1
        $one = StudentPackage::where('student_id', $student->id)->where('package_number', 1)->first();
        $one->update(['status' => 'paid', 'paid_at' => now()]);

        $this->attendedLesson($student, 30, now()->subDays(3)); // fills the paid #1

        $completed = $this->inbox(NotificationTypes::TEACHER_PACKAGE_COMPLETED);
        $this->assertSame([0, 1], $completed->pluck('payload.package_number')->sort()->values()->all());
    }

    /* ── Package paid ── */

    public function test_marking_a_package_paid_notifies_the_teacher_once(): void
    {
        $student = $this->student();
        $pkg = StudentPackage::create([
            'student_id' => $student->id, 'package_number' => 1, 'package_hours' => 4,
            'tariff_at_time' => 3600, 'currency' => 'EUR', 'status' => 'pending',
        ]);

        $this->asAdmin()->postJson("/api/system/student-packages/{$pkg->id}/confirm")->assertOk();

        $rows = $this->inbox(NotificationTypes::TEACHER_PACKAGE_PAID);
        $this->assertCount(1, $rows);
        $this->assertSame(1, $rows[0]->payload['package_number']);
        $this->assertSame(4, $rows[0]->payload['package_hours']);
        $this->assertArrayNotHasKey('tariff_at_time', $rows[0]->payload);

        // Reset to pending and paid again: still the same package, still one notification.
        $this->patchJson("/api/system/student-packages/{$pkg->id}", ['status' => 'pending'])->assertOk();
        $this->patchJson("/api/system/student-packages/{$pkg->id}", ['status' => 'paid'])->assertOk();
        $this->assertCount(1, $this->inbox(NotificationTypes::TEACHER_PACKAGE_PAID));
    }

    public function test_a_down_payment_opening_paid_is_not_reported_as_a_payment(): void
    {
        $student = $this->student();

        $this->attendedLesson($student, 30, now()); // the engine opens #0 already paid

        $this->assertCount(0, $this->inbox(NotificationTypes::TEACHER_PACKAGE_PAID));
    }

    public function test_closing_a_lead_reports_the_down_payment_to_the_teacher(): void
    {
        $student = $this->student(['source' => 'lead', 'status' => 'trial']);
        $lead = Lead::factory()->create(['student_id' => $student->id]);
        // The trial lesson already opened #0 as paid, so closing changes no status.
        $this->attendedLesson($student, 30, now()->subDay());

        app(LeadToStudentConverter::class)->convert($lead, ['package_hours' => 6, 'package_price_minor' => 5000]);

        $rows = $this->inbox(NotificationTypes::TEACHER_PACKAGE_PAID);
        $this->assertCount(1, $rows);
        $this->assertSame(0, $rows[0]->payload['package_number']);
        $this->assertSame(6, $rows[0]->payload['package_hours']);
    }

    /* ── Inbox access ── */

    public function test_teachers_can_read_their_own_inbox(): void
    {
        $this->student(); // one "student assigned" notification
        SysNotification::create(['user_id' => $this->adminUser()->id, 'type' => 'x', 'title' => 'Not yours']);

        $this->actingAs($this->teacherUser, 'sanctum');
        $this->getJson('/api/system/notifications/unread-count')->assertOk()->assertJson(['count' => 1]);
        $this->getJson('/api/system/notifications')->assertOk()->assertJsonCount(1, 'data');
        $mine = SysNotification::where('user_id', $this->teacherUser->id)->pluck('id')->all();
        $this->postJson('/api/system/notifications/read-all')->assertOk()->assertJson(['ids' => $mine]);
        $this->getJson('/api/system/notifications/unread-count')->assertJson(['count' => 0]);
        // Nothing left to mark the second time round.
        $this->postJson('/api/system/notifications/read-all')->assertJson(['ids' => []]);
    }
}
