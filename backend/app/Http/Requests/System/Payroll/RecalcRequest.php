<?php

namespace App\Http\Requests\System\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class RecalcRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'teacher_id' => ['sometimes', 'integer'],
            'year'       => ['sometimes', 'integer'],
            'month'      => ['sometimes', 'integer', 'min:1', 'max:12'],
        ];
    }
}
