<?php

namespace App\Http\Requests\System\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class ExportRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'period' => ['required', 'string', 'date_format:Y-m'],
            'format' => ['required', 'in:xlsx,pdf'],
        ];
    }
}
