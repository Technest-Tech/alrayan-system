<?php

namespace App\Http\Requests\System\Qc;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quality_manager_id' => ['required', 'exists:users,id'],
            'teacher_id'         => ['required', 'exists:sys_teachers,id'],
        ];
    }
}
