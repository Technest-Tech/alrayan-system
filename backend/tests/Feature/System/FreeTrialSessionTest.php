<?php

namespace Tests\Feature\System;

use App\Models\System\Lesson;
use App\Models\System\LessonPackageAllocation;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use App\Services\System\PackageService;
use Tests\SystemTestCase;

/**
 * The academy advertises the first session as a free trial. Students were being
 * billed for it because the rule depended on whoever recorded the lesson picking
 * the `trial` status, and most first lessons were saved as `attended`.
 */
class FreeTrialSessionTest extends SystemTestCase
{
    private Teacher $teacher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->teacher = Teacher::factory()->create();
        config(['system.first_session_free' => true]);
    }

    private function student(int $packageHours = 2): Student
    {
        return Student::factory()->create([
            'package_hours_default' => $packageHours,
            'hourly_rate_minor'     => 5000,
            'currency'              => 'USD',
        ]);
    }

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

    public function test_the_first_session_is_free_even_when_recorded_as_attended(): void
    {
        $s = $this->student(2);
        $trial = $this->lesson($s, 'attended', 60, now()->setTime(9, 0));
        $this->rebuild($s);

        $this->assertEqualsWithDelta(0.0, $this->packages($s)[0]->consumed_hours, 0.001,
            'the first session must not fill the package');
        $this->assertSame(0, LessonPackageAllocation::where('lesson_id', $trial->id)->count(),
            'the free trial gets no allocation');
        $this->assertEqualsWithDelta(0.0, (float) $trial->fresh()->session_number_hours, 0.001);
    }

    public function test_the_second_session_starts_billing_from_zero(): void
    {
        $s = $this->student(2);
        $this->lesson($s, 'attended', 60, now()->setTime(9, 0));           // free trial
        $second = $this->lesson($s, 'attended', 60, now()->setTime(11, 0)); // first billed hour
        $this->rebuild($s);

        $this->assertEqualsWithDelta(1.0, $this->packages($s)[0]->consumed_hours, 0.001,
            'only the second session is billed');
        $this->assertEqualsWithDelta(1.0,
            (float) LessonPackageAllocation::where('lesson_id', $second->id)->sum('hours'), 0.001);
    }

    public function test_a_cancellation_before_any_lesson_does_not_burn_the_trial(): void
    {
        $s = $this->student(2);
        $this->lesson($s, 'cancelled_by_teacher', 60, now()->setTime(8, 0)); // never sat
        $trial = $this->lesson($s, 'attended', 60, now()->setTime(9, 0));    // the real first session
        $billed = $this->lesson($s, 'attended', 60, now()->setTime(11, 0));
        $this->rebuild($s);

        $this->assertSame(0, LessonPackageAllocation::where('lesson_id', $trial->id)->count(),
            'the first session actually delivered is the free one');
        $this->assertEqualsWithDelta(1.0,
            (float) LessonPackageAllocation::where('lesson_id', $billed->id)->sum('hours'), 0.001);
        $this->assertEqualsWithDelta(1.0, $this->packages($s)[0]->consumed_hours, 0.001);
    }

    public function test_the_trial_is_spent_once_and_not_again_after_an_edit(): void
    {
        $s = $this->student(2);
        $this->lesson($s, 'attended', 60, now()->setTime(9, 0));
        $this->lesson($s, 'attended', 60, now()->setTime(11, 0));
        $this->lesson($s, 'attended', 60, now()->setTime(13, 0));
        $this->rebuild($s);
        $this->rebuild($s); // a second rebuild must be idempotent

        $this->assertEqualsWithDelta(2.0, $this->packages($s)[0]->consumed_hours, 0.001,
            'exactly one session is free, the other two are billed');
    }

    public function test_the_policy_can_be_switched_off(): void
    {
        config(['system.first_session_free' => false]);

        $s = $this->student(2);
        $this->lesson($s, 'attended', 60, now()->setTime(9, 0));
        $this->rebuild($s);

        $this->assertEqualsWithDelta(1.0, $this->packages($s)[0]->consumed_hours, 0.001,
            'with the policy off the first session bills as normal');
    }

    public function test_an_explicit_trial_status_still_bills_nothing_and_keeps_the_free_session(): void
    {
        $s = $this->student(2);
        $this->lesson($s, 'trial', 60, now()->setTime(9, 0));   // already free by status
        $first = $this->lesson($s, 'attended', 60, now()->setTime(11, 0));
        $billed = $this->lesson($s, 'attended', 60, now()->setTime(13, 0));
        $this->rebuild($s);

        // The `trial` status never consumed, so the free-trial allowance is still
        // unspent and lands on the first attended session.
        $this->assertSame(0, LessonPackageAllocation::where('lesson_id', $first->id)->count());
        $this->assertEqualsWithDelta(1.0,
            (float) LessonPackageAllocation::where('lesson_id', $billed->id)->sum('hours'), 0.001);
    }
}
