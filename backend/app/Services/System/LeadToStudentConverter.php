<?php

namespace App\Services\System;

use App\Models\System\Lead;
use App\Models\System\Student;
use Illuminate\Support\Facades\DB;

class LeadToStudentConverter
{
    public function convert(Lead $lead, array $studentData): Student
    {
        return DB::transaction(function () use ($lead, $studentData) {
            $student = Student::create(array_merge([
                'name'    => $lead->name,
                'email'   => $lead->email,
                'phone'   => $lead->phone,
                'whatsapp'=> $lead->whatsapp,
                'country' => $lead->country,
                'status'  => 'trial',
                'lead_id' => $lead->id,
            ], $studentData));

            $lead->update([
                'status'                  => 'enrolled',
                'converted_to_student_id' => $student->id,
            ]);

            return $student;
        });
    }
}
