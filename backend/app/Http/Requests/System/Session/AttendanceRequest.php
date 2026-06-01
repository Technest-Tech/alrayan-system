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
            // Required for both cancelled and absent — UI must specify whose fault it was.
            'cancelled_by'        => [
                'required_if:status,cancelled',
                'required_if:status,absent',
                'nullable',
                Rule::in(['student', 'teacher', 'admin']),
            ],
            'cancellation_reason' => ['nullable', 'string', 'max:500'],
            // Only meaningful when status=absent + cancelled_by=student.
            'apology_received'    => ['nullable', 'boolean'],
        ];
    }
}
