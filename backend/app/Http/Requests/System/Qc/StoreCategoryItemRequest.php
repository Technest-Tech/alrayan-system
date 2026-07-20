<?php

namespace App\Http\Requests\System\Qc;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label'            => ['required', 'string', 'max:255'],
            'penalty'          => ['nullable', 'integer', 'min:0', 'max:100'],
            'special_rule_key' => ['nullable', 'string', 'exists:sys_qc_special_rules,rule_key'],
            'sort_order'       => ['nullable', 'integer', 'min:0'],
            'is_active'        => ['nullable', 'boolean'],
        ];
    }
}
