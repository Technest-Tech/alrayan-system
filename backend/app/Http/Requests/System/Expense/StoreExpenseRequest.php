<?php

namespace App\Http\Requests\System\Expense;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'category_id'  => ['required', 'integer', 'exists:sys_expense_categories,id'],
            'account_id'   => ['nullable', 'integer', Rule::exists('sys_treasury_accounts', 'id')->whereNull('deleted_at')],
            'item_id'      => ['nullable', 'integer', Rule::exists('sys_expense_items', 'id')->whereNull('deleted_at')],
            'period'       => ['nullable', 'date_format:Y-m'],
            'amount_minor' => ['required', 'integer', 'min:1'],
            // Taken from the account when one is chosen.
            'currency'     => ['required_without:account_id', 'nullable', 'string', 'size:3'],
            'description'  => ['required', 'string', 'max:255'],
            'occurred_on'  => ['required', 'date'],
            'attachments'  => ['nullable', 'array'],
        ];
    }
}
