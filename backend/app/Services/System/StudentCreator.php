<?php

namespace App\Services\System;

use App\Models\System\Guardian;
use App\Models\System\Student;
use App\Models\System\StudentNote;
use App\Models\System\StudentTimelineEntry;
use App\Models\TrialBooking;
use App\Support\System\IdentityEmail;
use Illuminate\Support\Facades\DB;

/**
 * Creates a student together with its unified `users` identity row (role=student)
 * and, for child students, a guardian + parent user. Shared by the legacy
 * StudentController and the unified user-directory endpoint.
 */
class StudentCreator
{
    public function __construct(
        private readonly UserProvisioner $provisioner,
        private readonly PackageService $packages,
    ) {}

    /**
     * @param  array<string,mixed>  $data
     */
    public function create(array $data, ?int $actorId = null): Student
    {
        return DB::transaction(function () use ($data, $actorId) {
            $guardianId = $this->resolveGuardian($data);

            $email = $data['email'] ?? IdentityEmail::forStudent($data['name']);

            $user = $this->provisioner->create([
                'name'      => $data['name'],
                'email'     => $email,
                'whatsapp'  => $data['whatsapp'] ?? null,
                'status'    => $data['status'] ?? 'active',
                'language'  => $data['language'] ?? null,
                'birthday'  => $data['birthday'] ?? null,
                'gender'    => $data['gender'] ?? null,
                'photo_url' => $data['photo_url'] ?? null,
                'notes'     => $data['notes'] ?? null,
                'documents' => $data['documents'] ?? null,
                'emails'    => $data['emails'] ?? [],
                'phones'    => $data['phones'] ?? [],
            ], 'student');

            $student = Student::create([
                'user_id'              => $user->id,
                'name'                 => $data['name'],
                'email'                => $email,
                'whatsapp'             => $data['whatsapp'] ?? null,
                'country'              => $data['country'],
                'timezone'             => $data['timezone'],
                'student_type'         => $data['student_type'],
                'guardian_id'          => $guardianId,
                'course_id'            => $data['course_id'] ?? null,
                'assigned_teacher_id'  => $data['assigned_teacher_id'] ?? null,
                'sessions_per_month'   => $data['sessions_per_month'] ?? 0,
                'session_duration_min' => $data['session_duration_min'] ?? 30,
                'currency'             => $data['currency'] ?? 'USD',
                'monthly_price_minor'  => $data['monthly_price_minor'] ?? 0,
                'package_hours_default' => $data['package_hours_default'] ?? 0,
                'hourly_rate_minor'    => $data['hourly_rate_minor'] ?? 0,
                'custom_discount_pct'  => $data['custom_discount_pct'] ?? 0,
                'source'               => $data['source'] ?? 'manual',
                'trial_booking_id'     => $data['trial_booking_id'] ?? null,
                'status'               => 'trial',
            ]);

            StudentTimelineEntry::create([
                'student_id'    => $student->id,
                'actor_user_id' => $actorId,
                'event_type'    => 'created',
                'payload'       => ['source' => $student->source],
            ]);

            if (! empty($data['note'])) {
                StudentNote::create([
                    'student_id'     => $student->id,
                    'author_user_id' => $actorId,
                    'body'           => $data['note'],
                ]);
            }

            if (! empty($data['trial_booking_id'])) {
                TrialBooking::where('id', $data['trial_booking_id'])
                    ->update(['converted_to_student_id' => $student->id]);
            }

            // Open the enrolment down payment (Package #0, already paid) so the student's first
            // lessons are covered from the start. With no package size on file there is nothing
            // to size it from — the first logged lesson then opens #0 lazily instead.
            if ((int) $student->package_hours_default > 0) {
                $this->packages->ensureFirstPackage($student, (int) $student->package_hours_default);
            }

            AuditLog::record('student.created', $student);

            return $student;
        });
    }

    private function resolveGuardian(array $data): ?int
    {
        if (($data['student_type'] ?? null) !== 'child') {
            return null;
        }

        if (! empty($data['guardian_id'])) {
            return (int) $data['guardian_id'];
        }

        // Create a guardian + linked parent user.
        $email = IdentityEmail::forGuardian($data['guardian_name'] ?? 'Guardian');

        $parentUser = $this->provisioner->create([
            'name'     => $data['guardian_name'] ?? null,
            'email'    => $email,
            'whatsapp' => $data['guardian_whatsapp'] ?? null,
        ], 'parent');

        $guardian = Guardian::create([
            'user_id'  => $parentUser->id,
            'name'     => $data['guardian_name'] ?? null,
            'whatsapp' => $data['guardian_whatsapp'] ?? null,
        ]);

        return $guardian->id;
    }
}
