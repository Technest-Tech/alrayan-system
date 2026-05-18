<?php

namespace App\Http\Requests\System\Student;

use Illuminate\Foundation\Http\FormRequest;

class ActivateStudentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'course_id'             => ['nullable', 'integer', 'exists:courses,id'],
            'assigned_teacher_id'   => ['nullable', 'integer', 'exists:sys_teachers,id'],
            'sessions_per_month'    => ['required', 'integer', 'min:1', 'max:60'],
            'session_duration_min'  => ['required', 'in:30,45,60'],
            'currency'              => ['required', 'string', 'size:3'],
            'monthly_price_minor'   => ['required', 'integer', 'min:0'],
            'custom_discount_pct'   => ['nullable', 'integer', 'between:0,100'],
            'note'                  => ['nullable', 'string', 'max:5000'],
        ];
    }
}
