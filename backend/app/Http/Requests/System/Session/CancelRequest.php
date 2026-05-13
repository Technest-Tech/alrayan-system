<?php

namespace App\Http\Requests\System\Session;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CancelRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'cancelled_by'        => ['required', Rule::in(['student', 'teacher', 'admin', 'system'])],
            'cancellation_reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
