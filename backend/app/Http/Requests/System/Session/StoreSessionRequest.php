<?php

namespace App\Http\Requests\System\Session;

use Illuminate\Foundation\Http\FormRequest;

class StoreSessionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'student_id'          => ['required', 'integer', 'exists:sys_students,id'],
            'teacher_id'          => ['required', 'integer', 'exists:sys_teachers,id'],
            'scheduled_start'     => ['required', 'date'],
            'duration_min'        => ['required', 'integer', 'in:30,45,60'],
            'original_session_id' => ['nullable', 'integer', 'exists:sys_sessions,id'],
        ];
    }
}
