<?php

namespace App\Http\Requests\System\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class BulkTransferRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'items'                        => ['required', 'array'],
            'items.*.id'                   => ['required', 'integer'],
            'items.*.transfer_reference'   => ['required', 'string'],
        ];
    }
}
