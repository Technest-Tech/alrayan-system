<?php

namespace App\Http\Requests\System\Student;

use Illuminate\Foundation\Http\FormRequest;

class SiblingLinkRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'sibling_id'   => ['required', 'integer', 'exists:sys_students,id'],
            'discount_pct' => ['required', 'integer', 'between:0,100'],
        ];
    }
}
