<?php

namespace App\Http\Requests\System\Quality;

use Illuminate\Foundation\Http\FormRequest;

class SubmitReviewRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'period_year'       => ['required', 'integer'],
            'period_month'      => ['required', 'integer', 'min:1', 'max:12'],
            'attendance_score'  => ['required', 'integer', 'min:0', 'max:100'],
            'reports_score'     => ['required', 'integer', 'min:0', 'max:100'],
            'retention_score'   => ['required', 'integer', 'min:0', 'max:100'],
            'punctuality_score' => ['required', 'integer', 'min:0', 'max:100'],
            'notes'             => ['nullable', 'string'],
        ];
    }
}
