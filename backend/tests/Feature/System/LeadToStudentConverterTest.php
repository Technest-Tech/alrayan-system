<?php

namespace Tests\Feature\System;

use App\Models\System\Lead;
use App\Models\System\Student;
use App\Services\System\LeadToStudentConverter;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;
use Tests\SystemTestCase;

class LeadToStudentConverterTest extends SystemTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        // RevalidateNextPages fires on model saves and would hit the Next.js host.
        Http::fake();
    }

    public function test_fallback_path_provisions_a_user_for_the_student(): void
    {
        // A legacy lead with no provisioned student → exercises the Student::create fallback.
        $lead = Lead::create([
            'name'     => 'Orphan Probe',
            'email'    => 'orphan-probe@example.test',
            'whatsapp' => '+100000000',
            'country'  => 'EG',
            'status'   => 'new_lead',
            'source'   => 'manual',
        ]);
        $lead->forceFill(['student_id' => null])->saveQuietly();

        $student = app(LeadToStudentConverter::class)->convert($lead->fresh(), [
            'student_type'        => 'adult',
            'timezone'            => 'UTC',
            'currency'            => 'USD',
            'package_hours'       => 4,
            'package_price_minor' => 1000,
        ]);

        $this->assertNotNull($student->user_id, 'Converted student must have a linked user.');
        $this->assertSame('student', $student->user->role);
        $this->assertDatabaseHas('users', ['id' => $student->user_id, 'role' => 'student']);
    }

    public function test_backfill_command_creates_users_for_orphaned_students(): void
    {
        // A student with no user row — the production symptom.
        $student = Student::create([
            'name'                 => 'No User Student',
            'email'                => 'nouser@example.test',
            'country'              => 'EG',
            'timezone'             => 'UTC',
            'student_type'         => 'adult',
            'sessions_per_month'   => 0,
            'session_duration_min' => 30,
            'currency'             => 'USD',
            'status'               => 'active',
        ]);
        $this->assertNull($student->user_id);

        $this->artisan('system:students:backfill-users')->assertSuccessful();

        $student->refresh();
        $this->assertNotNull($student->user_id);
        $this->assertSame('student', $student->user->role);
    }
}
