<?php

namespace App\Http\Requests\System\Expense;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'category_id'  => ['sometimes', 'integer', 'exists:sys_expense_categories,id'],
            'account_id'   => ['sometimes', 'nullable', 'integer', Rule::exists('sys_treasury_accounts', 'id')->whereNull('deleted_at')],
            'item_id'      => ['sometimes', 'nullable', 'integer', Rule::exists('sys_expense_items', 'id')->whereNull('deleted_at')],
            'period'       => ['sometimes', 'nullable', 'date_format:Y-m'],
            'amount_minor' => ['sometimes', 'integer', 'min:1'],
            'currency'     => ['sometimes', 'string', 'size:3'],
            'description'  => ['sometimes', 'string', 'max:255'],
            'occurred_on'  => ['sometimes', 'date'],
            'attachments'  => ['nullable', 'array'],
        ];
    }
}
