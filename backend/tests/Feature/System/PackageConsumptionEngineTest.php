<?php

namespace Tests\Feature\System;

use App\Models\System\Lesson;
use App\Models\System\LessonPackageAllocation;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use App\Services\System\PackageService;
use Tests\SystemTestCase;

class PackageConsumptionEngineTest extends SystemTestCase
{
    private Teacher $teacher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->teacher = Teacher::factory()->create();
    }

    private function student(int $packageHours = 2): Student
    {
        return Student::factory()->create([
            'package_hours_default' => $packageHours,
            'hourly_rate_minor'     => 5000,
            'currency'              => 'USD',
        ]);
    }

    /** Create a lesson with a placeholder package, mirroring the controller flow. */
    private function lesson(Student $student, string $status, int $minutes, $at): Lesson
    {
        $pkg = app(PackageService::class)->resolvePackageForLesson($student);

        return Lesson::create([
            'package_id'       => $pkg->id,
            'teacher_id'       => $this->teacher->id,
            'student_id'       => $student->id,
            'scheduled_at'     => $at,
            'duration_minutes' => $minutes,
            'status'           => $status,
        ]);
    }

    private function rebuild(Student $s): void
    {
        app(PackageService::class)->rebuild($s);
    }

    private function packages(Student $s)
    {
        return StudentPackage::where('student_id', $s->id)->orderBy('package_number')->get();
    }

    /* ── Splitting ── */

    public function test_boundary_lesson_splits_across_two_packages(): void
    {
        $s = $this->student(2); // 2-hour packages
        $this->lesson($s, 'attended', 90, now()->setTime(9, 0));   // 1.5h
        $second = $this->lesson($s, 'attended', 60, now()->setTime(11, 0)); // 1.0h crosses the 2h limit
        $this->rebuild($s);

        $pkgs = $this->packages($s);
        $this->assertCount(2, $pkgs);
        $this->assertEqualsWithDelta(2.0, $pkgs[0]->consumed_hours, 0.001, 'package #1 fills exactly to its limit');
        $this->assertEqualsWithDelta(0.5, $pkgs[1]->consumed_hours, 0.001, 'overflow flows into package #2');

        $allocs = LessonPackageAllocation::where('lesson_id', $second->id)->orderBy('ordinal')->get();
        $this->assertCount(2, $allocs, 'boundary lesson has two allocations');
        $this->assertEqualsWithDelta(0.5, $allocs[0]->hours, 0.001);
        $this->assertEqualsWithDelta(2.0, $allocs[0]->cumulative_hours, 0.001);
        $this->assertEqualsWithDelta(0.5, $allocs[1]->hours, 0.001);
        $this->assertEqualsWithDelta(0.5, $allocs[1]->cumulative_hours, 0.001);

        // The boundary lesson's primary pointer is the package it started in.
        $this->assertSame($pkgs[0]->id, $second->fresh()->package_id);
    }

    /* ── Date-driven re-distribution ── */

    public function test_editing_a_date_reshifts_all_packages(): void
    {
        $s  = $this->student(2);
        $l1 = $this->lesson($s, 'attended', 60, now()->setTime(9, 0)->addDays(10));
        $l2 = $this->lesson($s, 'attended', 60, now()->setTime(9, 0)->addDays(20));
        $l3 = $this->lesson($s, 'attended', 60, now()->setTime(9, 0)->addDays(30));
        $this->rebuild($s);

        $pkgs = $this->packages($s);
        $this->assertSame($pkgs[1]->id, $l3->fresh()->package_id, 'l3 starts in package #2');

        // Move l3 to the front.
        $l3->update(['scheduled_at' => now()->setTime(9, 0)->addDays(1)]);
        $this->rebuild($s);

        $this->assertSame($pkgs[0]->id, $l3->fresh()->package_id, 'l3 shifts into package #1');
        $this->assertEqualsWithDelta(1.0, $l3->fresh()->session_number_hours, 0.001);
        $this->assertSame($pkgs[1]->id, $l2->fresh()->package_id, 'l2 pushed into package #2');
        $this->assertEqualsWithDelta(1.0, $l2->fresh()->session_number_hours, 0.001);
    }

    /* ── Paid/suspended packages re-shift (but are never auto-deleted) ── */

    public function test_paid_package_reshifts_on_later_edits(): void
    {
        $s  = $this->student(2);
        $l1 = $this->lesson($s, 'attended', 60, now()->setTime(9, 0)->addDays(10));
        $l2 = $this->lesson($s, 'attended', 60, now()->setTime(9, 0)->addDays(11));
        $this->rebuild($s);

        $pkg1 = $this->packages($s)->first();
        $pkg1->update(['status' => 'paid', 'paid_at' => now()]);

        // A new attended lesson dated BEFORE the paid package's lessons.
        $l0 = $this->lesson($s, 'attended', 60, now()->setTime(9, 0)->addDays(1));
        $this->rebuild($s);

        // The shift now flows THROUGH the paid package: l0 takes the front slot, l1 fills it to
        // its 2h limit, and l2 overflows into a new package — while the status stays 'paid'.
        $pkg1->refresh();
        $this->assertSame('paid', $pkg1->status, 'status is preserved');
        $this->assertEqualsWithDelta(2.0, $pkg1->consumed_hours, 0.001, 'paid package refills to its limit');
        $this->assertSame($pkg1->id, $l0->fresh()->package_id, 'l0 shifts into the paid package');
        $this->assertSame($pkg1->id, $l1->fresh()->package_id);

        $pkg2 = StudentPackage::where('student_id', $s->id)->where('package_number', 2)->first();
        $this->assertNotNull($pkg2);
        $this->assertSame($pkg2->id, $l2->fresh()->package_id, 'overflow pushed into package #2');
    }

    public function test_paid_package_is_protected_from_auto_deletion_when_emptied(): void
    {
        $s  = $this->student(2);
        $l1 = $this->lesson($s, 'attended', 60, now()->setTime(9, 0)->addDays(10));
        $this->rebuild($s);

        $pkg1 = $this->packages($s)->first();
        $pkg1->update(['status' => 'paid', 'paid_at' => now()]);

        // Remove the only lesson: the paid package is now empty but its record must survive.
        $l1->delete();
        $this->rebuild($s);

        $pkg1->refresh();
        $this->assertNull($pkg1->deleted_at, 'paid package is not auto-deleted');
        $this->assertEqualsWithDelta(0.0, $pkg1->consumed_hours, 0.001, 'its allocations re-shifted away');
    }

    /* ── Deleting a bill (package) ── */

    public function test_a_paid_bill_holding_no_lessons_can_be_deleted(): void
    {
        $s   = $this->student(2);
        $pkg = app(PackageService::class)->resolvePackageForLesson($s);
        $pkg->update(['status' => 'paid', 'paid_at' => now()]);

        $this->asAdmin()
            ->deleteJson("/api/system/student-packages/{$pkg->id}")
            ->assertOk()
            ->assertJson(['deleted' => true, 'restored' => false]);

        $this->assertSoftDeleted('sys_student_packages', ['id' => $pkg->id]);
    }

    public function test_deleting_a_bill_that_still_holds_lessons_rebuilds_it(): void
    {
        $s = $this->student(2);
        $this->lesson($s, 'attended', 60, now()->setTime(9, 0));
        $this->rebuild($s);

        $pkg = $this->packages($s)->first();

        // The engine derives packages from consumption, so this one has to come back.
        $this->asAdmin()
            ->deleteJson("/api/system/student-packages/{$pkg->id}")
            ->assertOk()
            ->assertJson(['deleted' => false, 'restored' => true]);

        $this->assertNotNull(StudentPackage::find($pkg->id), 'rebuild restored the package');
    }

    /* ── Status consumption rules ── */

    public function test_only_consuming_statuses_fill_the_package(): void
    {
        $s = $this->student(100); // one big package
        $statuses = ['attended', 'paid_absence', 'cancelled_by_student', 'scheduled', 'absent', 'cancelled_by_teacher', 'trial', 'free'];
        $i = 0;
        foreach ($statuses as $st) {
            $this->lesson($s, $st, 60, now()->setTime(9, 0)->addDays($i++));
        }
        $this->rebuild($s);

        // attended + paid_absence + cancelled_by_student = 3 consuming hours.
        // trial and free are both non-consuming (free is free for the student).
        $pkg = $this->packages($s)->first();
        $this->assertEqualsWithDelta(3.0, $pkg->consumed_hours, 0.001);

        foreach (['trial', 'free'] as $nonConsuming) {
            $lesson = Lesson::where('student_id', $s->id)->where('status', $nonConsuming)->first();
            $this->assertEquals(0.0, $lesson->fresh()->session_number_hours);
            $this->assertSame(0, LessonPackageAllocation::where('lesson_id', $lesson->id)->count());
        }

        $attended = Lesson::where('student_id', $s->id)->where('status', 'attended')->first();
        $this->assertSame(1, LessonPackageAllocation::where('lesson_id', $attended->id)->count());
    }

    /* ── Completion → task ── */

    public function test_filling_a_package_generates_a_completion_task(): void
    {
        $s = $this->student(2);
        $this->lesson($s, 'attended', 60, now()->setTime(9, 0));
        $this->lesson($s, 'attended', 60, now()->setTime(11, 0));
        $this->rebuild($s);

        $pkg1 = $this->packages($s)->first();
        $this->assertEqualsWithDelta(2.0, $pkg1->consumed_hours, 0.001);
        $this->assertDatabaseHas('sys_tasks', ['type' => 'package_complete']);
    }

    /* ── Down payment (Package #0) ── */

    public function test_down_payment_is_never_fed_lessons_and_never_deleted(): void
    {
        $s  = $this->student(2);
        $dp = app(PackageService::class)->createDownPayment($s);
        $this->assertSame(0, $dp->package_number, 'the down payment is package #0');

        // A rebuild with no lessons at all still keeps the down payment.
        $this->rebuild($s);
        $this->assertNull($dp->fresh()->deleted_at, 'down payment survives an empty rebuild');

        // Consuming lessons flow into lesson package #1 — never into #0.
        $this->lesson($s, 'attended', 60, now()->setTime(9, 0));
        $this->rebuild($s);

        $dp->refresh();
        $this->assertNull($dp->deleted_at, 'down payment is never auto-deleted');
        $this->assertSame(0, LessonPackageAllocation::where('package_id', $dp->id)->count(), 'no lessons allocate to #0');
        $this->assertEqualsWithDelta(0.0, $dp->consumed_hours, 0.001);
        $this->assertSame('pending', $dp->status);

        // The first lesson package is #1 (not #0) and it holds the lesson.
        $pkg1 = StudentPackage::where('student_id', $s->id)->where('package_number', 1)->first();
        $this->assertNotNull($pkg1, 'the first lesson package is #1, not #0');
        $this->assertEqualsWithDelta(1.0, $pkg1->consumed_hours, 0.001);
    }

    public function test_create_down_payment_is_idempotent(): void
    {
        $s = $this->student(2);
        $a = app(PackageService::class)->createDownPayment($s);
        $b = app(PackageService::class)->createDownPayment($s);

        $this->assertSame($a->id, $b->id, 're-creating returns the existing down payment');
        $this->assertSame(1, StudentPackage::where('student_id', $s->id)->where('package_number', 0)->count());
    }
}
