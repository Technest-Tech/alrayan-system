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

            // The quick "Closed" flow only sends package_hours + price. Any enrollment key that
            // wasn't supplied (or came through null) must NOT overwrite the value the student was
            // already provisioned with at lead-creation time — so drop those keys before updating.
            foreach (['course_id', 'assigned_teacher_id', 'timezone', 'student_type', 'session_duration_min', 'currency'] as $optional) {
                if (array_key_exists($optional, $studentData) && $studentData[$optional] === null) {
                    unset($studentData[$optional]);
                }
            }
            // Only (re)set guardianship when student_type was explicitly supplied (full form).
            if (array_key_exists('student_type', $studentData)) {
                $studentData['guardian_id'] = $guardianId;
            }
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

                // Defaults cover the quick-close path where enrollment fields weren't collected.
                $student = Student::create(array_merge([
                    'user_id'              => $user->id,
                    'name'                 => $lead->name,
                    'email'                => $email,
                    'whatsapp'             => $lead->whatsapp,
                    'country'              => $lead->country,
                    'lead_id'              => $lead->id,
                    'timezone'             => 'UTC',
                    'student_type'         => 'adult',
                    'session_duration_min' => 30,
                ], $studentData));
            }

            // The student's first payment is the down payment — and it IS lesson Package #1: a real
            // package carrying the enrolled hours that follows the pending → paid lifecycle, and whose
            // lessons count as paid once it is paid. If a lesson package already exists (e.g. a trial
            // lesson created one lazily), capture the entered hours/tariff on it and re-shift;
            // otherwise create Package #1 upfront so the down payment can be collected before lessons.
            $lessonPackage = $student->packages()
                ->where('package_hours', '>', 0)
                ->orderBy('package_number')
                ->first();
            if ($lessonPackage) {
                $lessonPackage->update([
                    'package_hours'  => $packageHours,
                    'tariff_at_time' => $student->hourly_rate_minor,
                    'currency'       => $student->currency,
                ]);
                $this->packages->rebuild($student);
            } else {
                $this->packages->ensureFirstPackage($student, $packageHours);
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
