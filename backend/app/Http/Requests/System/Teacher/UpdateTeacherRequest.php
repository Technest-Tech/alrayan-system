<?php

namespace App\Http\Requests\System\Teacher;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTeacherRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'qualifications'          => ['nullable', 'string'],
            'cv_url'                  => ['nullable', 'url', 'max:2048'],
            'teachable_course_ids'    => ['nullable', 'array'],
            'teachable_course_ids.*'  => ['integer', 'exists:courses,id'],
            'payment_method'          => ['sometimes', 'in:vodafone_cash,instapay,wallet_other'],
            'payment_account_details' => ['nullable', 'string', 'max:500'],
            'hourly_rate'             => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
