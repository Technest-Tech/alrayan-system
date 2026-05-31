<?php

namespace App\Services\System;

use App\Models\System\Guardian;
use App\Models\System\Lead;
use App\Models\System\Student;
use Illuminate\Support\Facades\DB;

class LeadToStudentConverter
{
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

            unset($studentData['guardian_name'], $studentData['guardian_whatsapp']);

            $student = Student::create(array_merge([
                'name'        => $lead->name,
                'email'       => $lead->email,
                'whatsapp'    => $lead->whatsapp,
                'country'     => $lead->country,
                'status'      => 'trial',
                'lead_id'     => $lead->id,
                'guardian_id' => $guardianId,
            ], $studentData));

            $lead->update([
                'status'                  => 'enrolled',
                'converted_to_student_id' => $student->id,
            ]);

            return $student;
        });
    }
}
