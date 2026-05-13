<?php

namespace App\Http\Requests\System\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'due_at'        => ['sometimes', 'date'],
            'voided_reason' => ['sometimes', 'string'],
        ];
    }
}
