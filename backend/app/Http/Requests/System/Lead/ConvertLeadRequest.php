<?php

namespace App\Http\Requests\System\Lead;

use Illuminate\Foundation\Http\FormRequest;

class ConvertLeadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            // Package-based enrollment: a starting package of N hours at a fixed tariff (price).
            // These two are the only inputs the quick "Closed" flow collects.
            'package_hours'         => 'required|integer|min:1',
            'package_price_minor'   => 'required|integer|min:0',
            // Everything else is optional: a lead already provisioned a student at creation, so
            // when a key is omitted the converter keeps the student's existing value. The full
            // enrollment form still sends these and they are validated when present.
            'course_id'             => 'sometimes|nullable|exists:courses,id',
            'assigned_teacher_id'   => 'sometimes|nullable|exists:sys_teachers,id',
            'timezone'              => 'sometimes|nullable|string|max:60',
            'student_type'          => 'sometimes|nullable|in:child,adult',
            'session_duration_min'  => 'sometimes|nullable|integer|in:30,45,60',
            'currency'              => 'sometimes|nullable|string|size:3',
            // Child: link existing guardian or create a new one
            'guardian_id'           => 'nullable|integer|exists:sys_guardians,id',
            'guardian_name'         => 'required_if:student_type,child|nullable|string|max:255',
            'guardian_whatsapp'     => 'required_if:student_type,child|nullable|string|max:32',
        ];
    }
}
