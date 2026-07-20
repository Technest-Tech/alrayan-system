<?php

namespace App\Http\Requests\System\Qc;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id'         => ['sometimes', 'required', 'exists:sys_teachers,id'],
            'student_id'         => ['sometimes', 'required', 'exists:sys_students,id'],
            'quality_manager_id' => ['nullable', 'exists:users,id'],
            'duration_minutes'   => ['sometimes', 'required', 'integer', 'min:1', 'max:600'],
            'general_notes'      => ['nullable', 'string', 'max:5000'],
            'evaluated_at'       => ['nullable', 'date'],
            'checked_item_ids'   => ['sometimes', 'array'],
            'checked_item_ids.*' => ['integer'],
        ];
    }
}
