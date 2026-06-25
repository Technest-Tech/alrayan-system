<?php

namespace App\Services\System;

use App\Models\System\Guardian;
use App\Models\System\Lead;
use App\Models\System\Student;
use App\Support\System\IdentityEmail;
use Illuminate\Support\Facades\DB;

class LeadToStudentConverter
{
    public function __construct(
        private PackageService $packages,
        private UserProvisioner $provisioner,
    ) {}

    public function convert(Lead $lead, array $studentData): Student
    {
        return DB::transaction(function () use ($lead, $studentData) {
            // Resolve or create guardian for child students
            $guardianId = null;
            if (($studentData['student_type'] ?? null) === 'child') {
                if (!empty($studentData['guardian_id'])) {
                    $guardianId = $studentData['guardian_id'];
                } else {
                    $guardian   = Guardian::create([
                        'name'     => $studentData['guardian_name'],
                        'whatsapp' => $studentData['guardian_whatsapp'],
                    ]);
                    $guardianId = $guardian->id;
                }
            }

            // Package-based enrollment: the entered hours/price seed the student's
            // package defaults and the first pending package (no monthly pricing).
            $packageHours = max(1, (int) ($studentData['package_hours'] ?? 1));
            $studentData['package_hours_default'] = $packageHours;
            $studentData['hourly_rate_minor']     = (int) ($studentData['package_price_minor'] ?? 0);

            unset(
                $studentData['guardian_name'],
                $studentData['guardian_whatsapp'],
                $studentData['package_hours'],
                $studentData['package_price_minor'],
            );

            $studentData['guardian_id'] = $guardianId;
            // Closing finalises payment → the student becomes active.
            $studentData['status'] = 'active';

            // A lead provisions a student (+ user) at creation, so normally we finalise that
            // existing record. Legacy/factory leads without one fall back to a fresh student.
            $student = $lead->student;
            if ($student) {
                $student->update($studentData);
            } else {
                // No provisioned student → also mint the unified `users` identity row,
                // otherwise the converted student is invisible in the user directory.
                $email = $lead->email ?: IdentityEmail::forStudent($lead->name);
                $user  = $this->provisioner->create([
                    'name'     => $lead->name,
                    'email'    => $email,
                    'whatsapp' => $lead->whatsapp,
                    'status'   => $studentData['status'] ?? 'active',
                ], 'student');

                $student = Student::create(array_merge([
                    'user_id'  => $user->id,
                    'name'     => $lead->name,
                    'email'    => $email,
                    'whatsapp' => $lead->whatsapp,
                    'country'  => $lead->country,
                    'lead_id'  => $lead->id,
                ], $studentData));
            }

            // Capture the entered hours/tariff on the student's first package. If a package was
            // already created lazily (e.g. by a trial lesson), update it in place; otherwise seed it.
            $firstPackage = $student->packages()->orderBy('package_number')->first();
            if ($firstPackage) {
                $firstPackage->update([
                    'package_hours'  => $packageHours,
                    'tariff_at_time' => $student->hourly_rate_minor,
                    'currency'       => $student->currency,
                ]);
                $this->packages->rebuild($student);
            } else {
                $this->packages->createPackage($student, 1, $packageHours);
            }

            $lead->update([
                'status'                  => 'closed',
                'converted_to_student_id' => $student->id,
                'student_id'              => $student->id,
            ]);

            return $student;
        });
    }
}
