<?php

namespace App\Http\Requests\System\Teacher;

use Illuminate\Foundation\Http\FormRequest;

class StoreTeacherRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'                    => ['required', 'string', 'max:255'],
            'email'                   => ['required', 'email', 'unique:users,email'],
            'phone'                   => ['nullable', 'string', 'max:32'],
            'whatsapp'                => ['nullable', 'string', 'max:32'],
            'qualifications'          => ['nullable', 'string'],
            'cv_url'                  => ['nullable', 'url', 'max:2048'],
            'teachable_course_ids'    => ['nullable', 'array'],
            'teachable_course_ids.*'  => ['integer', 'exists:courses,id'],
            'payment_method'          => ['required', 'in:vodafone_cash,instapay,wallet_other'],
            'payment_account_details' => ['nullable', 'string', 'max:500'],
            'hourly_rate'             => ['required', 'integer', 'min:0'],
        ];
    }
}
