<?php

namespace App\Http\Requests\System\SessionReport;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReportRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'covered_text'       => ['sometimes', 'string', 'min:10', 'max:2000'],
            'performance'        => ['sometimes', Rule::in(['excellent', 'good', 'needs_improvement'])],
            'homework_text'      => ['nullable', 'string', 'max:1000'],
            'next_session_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
