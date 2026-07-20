<?php

namespace App\Http\Requests\System\Qc;

use App\Models\System\QcSpecialRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSpecialRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rule_key'  => ['required', 'string', 'max:64', 'regex:/^[a-z0-9_]+$/', 'unique:sys_qc_special_rules,rule_key'],
            'rule_type' => ['nullable', Rule::in(QcSpecialRule::RULE_TYPES)],
            'label'     => ['required', 'string', 'max:255'],
            'cap_value' => ['required', 'integer', 'min:0', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
