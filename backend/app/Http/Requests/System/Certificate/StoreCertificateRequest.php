<?php

namespace App\Http\Requests\System\Certificate;

use Illuminate\Foundation\Http\FormRequest;

class StoreCertificateRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'student_id'  => ['required', 'integer', 'exists:sys_students,id'],
            'course_id'   => ['nullable', 'integer', 'exists:courses,id'],
            'teacher_id'  => ['nullable', 'integer', 'exists:sys_teachers,id'],
            'type'        => ['required', 'in:course_completion,hifz_milestone,ijazah,other'],
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'issued_on'   => ['required', 'date'],
        ];
    }
}
