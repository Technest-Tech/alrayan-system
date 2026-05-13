<?php

namespace App\Http\Requests\System\Wallet;

use Illuminate\Foundation\Http\FormRequest;

class CreditWalletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount_minor' => ['required', 'integer', 'min:1'],
            'note'         => ['nullable', 'string', 'max:500'],
        ];
    }
}
