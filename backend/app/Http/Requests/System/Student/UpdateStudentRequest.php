<?php

namespace App\Http\Requests\System\Student;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $studentId = $this->route('student')?->id ?? $this->route('id');

        return [
            'name'                  => ['sometimes', 'string', 'max:255'],
            'email'                 => ['sometimes', 'nullable', 'email', "unique:sys_students,email,{$studentId}"],
            'phone'                 => ['sometimes', 'nullable', 'string', 'max:32'],
            'whatsapp'              => ['sometimes', 'nullable', 'string', 'max:32'],
            'country'               => ['sometimes', 'string', 'size:2'],
            'timezone'              => ['sometimes', 'timezone'],
            'age_category'          => ['sometimes', 'in:child,adult'],
            'parent_name'           => ['nullable', 'string', 'max:255'],
            'parent_phone'          => ['nullable', 'string', 'max:32'],
            'parent_whatsapp'       => ['nullable', 'string', 'max:32'],
            'parent_email'          => ['nullable', 'email'],
            'course_id'             => ['nullable', 'integer', 'exists:courses,id'],
            'assigned_teacher_id'   => ['nullable', 'integer', 'exists:sys_teachers,id'],
            'sessions_per_month'    => ['sometimes', 'integer', 'min:0', 'max:60'],
            'session_duration_min'  => ['sometimes', 'in:30,45,60'],
            'currency'              => ['sometimes', 'string', 'size:3'],
            'monthly_price_minor'   => ['sometimes', 'integer', 'min:0'],
            'custom_discount_pct'   => ['nullable', 'integer', 'between:0,100'],
            'whatsapp_group_link'   => ['nullable', 'url', 'max:500'],
            'whatsapp_group_status' => ['nullable', 'in:active,stopped,none'],
        ];
    }
}
