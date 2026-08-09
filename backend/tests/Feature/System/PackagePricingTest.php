<?php

namespace Tests\Feature\System;

use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use App\Models\User;
use App\Services\System\PackageService;
use Tests\SystemTestCase;

/**
 * The hours and price an admin types must be the hours and price the system keeps.
 *
 * Regressions covered here, all reported as "the system writes something different and then
 * refuses to let me change it":
 *  - a manually created student was charged their *teacher's* hourly tariff as a package price
 *  - every engine-invented package reset to the student's enrolment defaults
 *  - editing a pending package's hours soft-deleted the very row being edited
 *  - editing the tariff on the user form never reached the package any screen actually reads
 */
class PackagePricingTest extends SystemTestCase
{
    private function packages(Student $s)
    {
        return StudentPackage::where('student_id', $s->id)->orderBy('package_number')->get();
    }

    public function test_manually_created_student_is_not_charged_the_teacher_tariff(): void
    {
        // On the user form `hourly_rate_minor` is "Teacher Tariff (Money/Hour)" and
        // `monthly_price_minor` is "Tariff (Package Price)". With no package price on file the
        // old `?:` fallback quietly priced the package at the teacher's rate.
        $student = Student::factory()->create([
            'source'                => 'manual',
            'package_hours_default' => 8,
            'monthly_price_minor'   => 0,
            'hourly_rate_minor'     => 5000,
        ]);

        $package = app(PackageService::class)->createPackage($student, 0);

        $this->assertSame(0, (int) $package->tariff_at_time);
        $this->assertSame(8, (int) $package->package_hours);
    }

    public function test_lead_converted_student_still_reads_its_price_from_the_converter_column(): void
    {
        // The lead converter stores the agreed package price in hourly_rate_minor, so for a
        // lead-sourced student that column IS the package price — the fallback stays for them.
        $student = Student::factory()->create([
            'source'                => 'lead',
            'package_hours_default' => 6,
            'monthly_price_minor'   => 0,
            'hourly_rate_minor'     => 9000,
        ]);

        $package = app(PackageService::class)->createPackage($student, 0);

        $this->assertSame(9000, (int) $package->tariff_at_time);
    }

    public function test_a_new_package_inherits_the_previous_packages_hours_and_price(): void
    {
        $teacher = Teacher::factory()->create();
        $student = Student::factory()->create([
            'source'                => 'manual',
            'package_hours_default' => 2,
            'monthly_price_minor'   => 3000,
        ]);

        $engine = app(PackageService::class);

        // The admin renegotiates #0: 5 hours for 12000, not the 2h/3000 enrolment default.
        $first = $engine->ensureFirstPackage($student, 5);
        $first->update(['package_hours' => 5, 'tariff_at_time' => 12000, 'is_manual' => true]);

        // Six hours of lessons overflow #0 and force the engine to invent #1.
        for ($i = 0; $i < 6; $i++) {
            Lesson::create([
                'package_id'       => $first->id,
                'teacher_id'       => $teacher->id,
                'student_id'       => $student->id,
                'scheduled_at'     => now()->addDays($i),
                'duration_minutes' => 60,
                'status'           => 'attended',
            ]);
        }

        $engine->rebuild($student);

        $packages = $this->packages($student);
        $this->assertCount(2, $packages);

        // #1 continues the deal the student is on, rather than resetting to 2h/3000.
        $this->assertSame(5, (int) $packages[1]->package_hours);
        $this->assertSame(12000, (int) $packages[1]->tariff_at_time);
    }

    public function test_editing_a_pending_packages_hours_does_not_delete_it(): void
    {
        $student = Student::factory()->withUser()->create([
            'source'                => 'manual',
            'package_hours_default' => 4,
            'monthly_price_minor'   => 4000,
        ]);

        $package = StudentPackage::create([
            'student_id'     => $student->id,
            'package_number' => 1,
            'package_hours'  => 4,
            'tariff_at_time' => 4000,
            'currency'       => 'USD',
            'status'         => 'pending',
        ]);

        // It holds no lessons, so the rebuild triggered by the hours change used to bin it —
        // 200 OK, and the row silently gone from the list.
        $this->asAdmin()
            ->patchJson("/api/system/student-packages/{$package->id}", [
                'package_hours'  => 10,
                'tariff_at_time' => 15000,
            ])
            ->assertOk();

        $fresh = StudentPackage::find($package->id);

        $this->assertNotNull($fresh, 'the edited package must survive the rebuild');
        $this->assertSame(10, (int) $fresh->package_hours);
        $this->assertSame(15000, (int) $fresh->tariff_at_time);
    }

    public function test_editing_the_tariff_on_the_user_form_reaches_the_open_package(): void
    {
        $student = Student::factory()->withUser()->create([
            'source'                => 'manual',
            'package_hours_default' => 4,
            'monthly_price_minor'   => 4000,
        ]);

        $open = StudentPackage::create([
            'student_id'     => $student->id,
            'package_number' => 1,
            'package_hours'  => 4,
            'tariff_at_time' => 4000,
            'currency'       => 'USD',
            'status'         => 'pending',
        ]);

        $this->asAdmin()
            ->patchJson("/api/system/users/directory/{$student->user_id}", [
                'monthly_price_minor'   => 25000,
                'package_hours_default' => 12,
            ])
            ->assertOk();

        $open->refresh();

        $this->assertSame(25000, (int) $open->tariff_at_time);
        $this->assertSame(12, (int) $open->package_hours);
    }

    public function test_a_paid_package_is_not_repriced_by_a_user_form_edit(): void
    {
        // A settled bill is history — correcting it is a deliberate act in Manage Packages,
        // never a side effect of touching the student's enrolment figures.
        $student = Student::factory()->withUser()->create([
            'source'                => 'manual',
            'package_hours_default' => 4,
            'monthly_price_minor'   => 4000,
        ]);

        $paid = StudentPackage::create([
            'student_id'     => $student->id,
            'package_number' => 0,
            'package_hours'  => 4,
            'tariff_at_time' => 4000,
            'currency'       => 'USD',
            'status'         => 'paid',
            'paid_at'        => now(),
        ]);

        $this->asAdmin()
            ->patchJson("/api/system/users/directory/{$student->user_id}", [
                'monthly_price_minor' => 99000,
            ])
            ->assertOk();

        $this->assertSame(4000, (int) $paid->refresh()->tariff_at_time);
    }
}
