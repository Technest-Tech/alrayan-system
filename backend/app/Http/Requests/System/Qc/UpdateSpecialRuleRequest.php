<?php

namespace App\Http\Requests\System\Qc;

use App\Models\System\QcSpecialRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSpecialRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('qcSpecialRule')?->id;

        return [
            'rule_key'  => ['sometimes', 'required', 'string', 'max:64', 'regex:/^[a-z0-9_]+$/', Rule::unique('sys_qc_special_rules', 'rule_key')->ignore($id)],
            'rule_type' => ['sometimes', Rule::in(QcSpecialRule::RULE_TYPES)],
            'label'     => ['sometimes', 'required', 'string', 'max:255'],
            'cap_value' => ['sometimes', 'required', 'integer', 'min:0', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
