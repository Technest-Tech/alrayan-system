<?php

namespace App\Http\Requests\System\Session;

use Illuminate\Foundation\Http\FormRequest;

class RescheduleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'scheduled_start'  => ['required', 'date'],
            'reason'           => ['nullable', 'string', 'max:500'],
            'force_conflicts'  => ['boolean'],
        ];
    }
}
