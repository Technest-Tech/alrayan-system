<?php

namespace Tests\Feature\System;

use App\Models\System\Lead;
use App\Models\System\Lesson;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\Teacher;
use App\Models\User;
use App\Services\System\LeadToStudentConverter;
use App\Services\System\PackageService;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;
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
 *  - a finished package was followed by a 1-hour package in the wrong currency
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

    private function attended(Student $student, Teacher $teacher, int $count, int $dayOffset = 0): void
    {
        for ($i = 0; $i < $count; $i++) {
            Lesson::create([
                // Placeholder package, as the lesson controller does; the rebuild re-places it.
                'package_id'       => app(PackageService::class)->resolvePackageForLesson($student)->id,
                'teacher_id'       => $teacher->id,
                'student_id'       => $student->id,
                'scheduled_at'     => now()->addDays($dayOffset + $i),
                'duration_minutes' => 60,
                'status'           => 'attended',
            ]);
        }
    }

    public function test_the_package_after_a_finished_one_keeps_its_hours_and_currency(): void
    {
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        Http::fake();
        $teacher = Teacher::factory()->create();
        $engine  = app(PackageService::class);

        // A lead provisions its student up front with no package size and the USD default.
        $leadId = $this->asAdmin()
            ->postJson('/api/system/leads', ['name' => 'Renewal Probe', 'source' => 'manual_entry'])
            ->assertCreated()
            ->json('data.id');
        $lead    = Lead::findOrFail($leadId);
        $student = $lead->student;
        $this->assertSame('USD', $student->currency);

        // A first one-hour lesson before the lead is closed: the engine opens #0 at its 1-hour
        // floor, fills it exactly and opens the next package straight away — 1h, USD.
        $this->attended($student, $teacher, 1);
        $engine->rebuild($student);

        // Closing the lead sets the real deal: 8 hours in EUR. #0 grows, so the follow-up
        // package it had opened is empty again and is cleared away.
        app(LeadToStudentConverter::class)->convert($lead->fresh(), [
            'currency'            => 'EUR',
            'package_hours'       => 8,
            'package_price_minor' => 16000,
        ]);

        // The student uses up the 8 hours.
        $this->attended($student, $teacher, 7, 1);
        $engine->rebuild($student->fresh());

        $packages = $this->packages($student);
        $this->assertCount(2, $packages);
        $next = $packages[1];
        $this->assertSame(8, (int) $next->package_hours, 'the next package continues the 8-hour deal');
        $this->assertSame('EUR', $next->currency, 'the next package keeps the student\'s currency');
        $this->assertSame(16000, (int) $next->tariff_at_time);
        $this->assertSame('pending', $next->status);
    }

    public function test_a_new_package_keeps_the_previous_packages_currency(): void
    {
        // Currency corrected on the package itself (Manage Packages) while the student row still
        // carries the USD default: the follow-up package must not fall back to USD.
        $teacher = Teacher::factory()->create();
        $student = Student::factory()->create([
            'source'                => 'manual',
            'package_hours_default' => 2,
            'monthly_price_minor'   => 3000,
            'currency'              => 'USD',
        ]);

        $engine = app(PackageService::class);
        $engine->ensureFirstPackage($student, 2)->update(['currency' => 'EUR', 'is_manual' => true]);

        $this->attended($student, $teacher, 3);
        $engine->rebuild($student);

        $this->assertSame('EUR', $this->packages($student)[1]->currency);
    }

    public function test_the_repair_command_puts_existing_wrong_packages_back_on_the_deal(): void
    {
        $teacher = Teacher::factory()->create();
        $student = Student::factory()->create(['source' => 'lead', 'currency' => 'USD']);

        // What production holds after the bug: #0 is the real 8h EUR deal, #1 came back as a
        // 1-hour USD placeholder and has already swallowed a lesson, #2 was then set by hand.
        $engine = app(PackageService::class);
        StudentPackage::create(['student_id' => $student->id, 'package_number' => 0, 'package_hours' => 8,
            'tariff_at_time' => 16000, 'currency' => 'EUR', 'status' => 'paid', 'paid_at' => now()]);
        $this->attended($student, $teacher, 9);
        $engine->rebuild($student);

        $wrong = StudentPackage::where('student_id', $student->id)->where('package_number', 1)->firstOrFail();
        $wrong->update(['package_hours' => 1, 'tariff_at_time' => 0, 'currency' => 'USD']);
        $engine->rebuild($student);   // #1 holds a lesson now, so the engine leaves its terms alone

        $manual = StudentPackage::where('student_id', $student->id)->where('package_number', 2)->firstOrFail();
        $manual->update(['package_hours' => 5, 'tariff_at_time' => 9000, 'currency' => 'EUR', 'is_manual' => true]);
        $this->assertSame(1, (int) $wrong->refresh()->package_hours);

        $this->artisan('sys:repair-follow-on-packages', ['--dry-run' => true])->assertSuccessful();
        $this->assertSame(1, (int) $wrong->refresh()->package_hours, 'a dry run writes nothing');

        $this->artisan('sys:repair-follow-on-packages')->assertSuccessful();

        $wrong->refresh();
        $this->assertSame(8, (int) $wrong->package_hours);
        $this->assertSame('EUR', $wrong->currency);
        $this->assertSame(16000, (int) $wrong->tariff_at_time);
        $this->assertEqualsWithDelta(1.0, $wrong->consumed_hours, 0.001, 'the 9th hour now sits in #1');
        $this->assertSame(5, (int) $manual->refresh()->package_hours, 'hand-set packages are left alone');
    }
}
