<?php

namespace App\Http\Requests\System\Expense;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'category_id'  => ['required', 'integer', 'exists:sys_expense_categories,id'],
            'amount_minor' => ['required', 'integer', 'min:1'],
            'currency'     => ['required', 'string', 'size:3'],
            'description'  => ['required', 'string', 'max:500'],
            'occurred_on'  => ['required', 'date'],
            'attachments'  => ['nullable', 'array'],
        ];
    }
}
