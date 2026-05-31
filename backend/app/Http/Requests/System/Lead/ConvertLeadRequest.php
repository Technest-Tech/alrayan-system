<?php

namespace App\Http\Requests\System\Lead;

use Illuminate\Foundation\Http\FormRequest;

class ConvertLeadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'course_id'             => 'required|exists:courses,id',
            'assigned_teacher_id'   => 'required|exists:sys_teachers,id',
            'timezone'              => 'required|string|max:60',
            'student_type'          => 'required|in:child,adult',
            'sessions_per_month'    => 'required|integer|min:1|max:30',
            'session_duration_min'  => 'required|integer|in:30,45,60',
            'monthly_price_minor'   => 'required|integer|min:0',
            'currency'              => 'required|string|size:3',
            // Child: link existing guardian or create a new one
            'guardian_id'           => 'nullable|integer|exists:sys_guardians,id',
            'guardian_name'         => 'required_if:student_type,child|nullable|string|max:255',
            'guardian_whatsapp'     => 'required_if:student_type,child|nullable|string|max:32',
        ];
    }
}
