<?php

namespace App\Http\Requests\System;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Locked-down field set a teacher may change on their own profile. Note the
 * deliberate omissions: email, role, is_active/status and pay rates are NOT
 * editable here — those are admin-controlled.
 */
class UpdateMeProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'teacher';
    }

    public function rules(): array
    {
        return [
            'name'                    => ['sometimes', 'string', 'max:255'],
            'phone'                   => ['nullable', 'string', 'max:32'],
            'whatsapp'                => ['nullable', 'string', 'max:32'],
            'birthday'                => ['nullable', 'date'],
            'gender'                  => ['nullable', 'in:male,female'],
            'language'                => ['nullable', 'string', 'max:10'],
            'photo_url'               => ['nullable', 'string', 'max:2048'],

            'documents'               => ['nullable', 'array'],
            'documents.*'             => ['nullable', 'string', 'max:2048'],

            'relatives'               => ['nullable', 'array'],
            'relatives.*.name'        => ['required_with:relatives.*', 'string', 'max:255'],
            'relatives.*.relation'    => ['nullable', 'string', 'max:120'],
            'relatives.*.phone'       => ['nullable', 'string', 'max:32'],

            'payment_method'          => ['sometimes', 'in:vodafone_cash,instapay,wallet_other'],
            'payment_account_details' => ['nullable', 'string', 'max:500'],
        ];
    }
}
