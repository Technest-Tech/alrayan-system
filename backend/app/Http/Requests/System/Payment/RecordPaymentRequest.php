<?php

namespace App\Http\Requests\System\Payment;

use Illuminate\Foundation\Http\FormRequest;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount_minor' => ['required', 'integer', 'min:1'],
            'currency'     => ['required', 'string', 'size:3'],
            'method'       => ['required', 'in:paymob,bank_transfer,paypal,vodafone_cash,instapay,wallet,other'],
            'reference'    => ['nullable', 'string', 'max:200'],
            'paid_at'      => ['nullable', 'date'],
        ];
    }
}
