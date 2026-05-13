<?php

namespace App\Http\Requests\System\Expense;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'category_id'  => ['sometimes', 'integer', 'exists:sys_expense_categories,id'],
            'amount_minor' => ['sometimes', 'integer', 'min:1'],
            'currency'     => ['sometimes', 'string', 'size:3'],
            'description'  => ['sometimes', 'string', 'max:500'],
            'occurred_on'  => ['sometimes', 'date'],
            'attachments'  => ['nullable', 'array'],
        ];
    }
}
