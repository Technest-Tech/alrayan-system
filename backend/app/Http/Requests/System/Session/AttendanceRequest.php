<?php

namespace App\Http\Requests\System\Session;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AttendanceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'status'              => ['required', Rule::in(['attended', 'absent', 'cancelled'])],
            'cancelled_by'        => ['required_if:status,cancelled', Rule::in(['student', 'teacher', 'admin'])],
            'cancellation_reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
