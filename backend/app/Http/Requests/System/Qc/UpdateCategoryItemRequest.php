<?php

namespace App\Http\Requests\System\Qc;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label'            => ['sometimes', 'required', 'string', 'max:255'],
            'penalty'          => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],
            'special_rule_key' => ['sometimes', 'nullable', 'string', 'exists:sys_qc_special_rules,rule_key'],
            'sort_order'       => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_active'        => ['sometimes', 'boolean'],
        ];
    }
}
