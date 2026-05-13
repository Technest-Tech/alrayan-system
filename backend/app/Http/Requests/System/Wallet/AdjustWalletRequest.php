<?php

namespace App\Http\Requests\System\Wallet;

use Illuminate\Foundation\Http\FormRequest;

class AdjustWalletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount_minor' => ['required', 'integer'],
            'note'         => ['required', 'string', 'max:500'],
        ];
    }
}
