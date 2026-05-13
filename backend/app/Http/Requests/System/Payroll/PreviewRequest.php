<?php

namespace App\Http\Requests\System\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class PreviewRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'teacher_id' => ['required', 'integer'],
            'year'       => ['required', 'integer'],
            'month'      => ['required', 'integer', 'min:1', 'max:12'],
        ];
    }
}
