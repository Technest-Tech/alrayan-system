<?php

namespace App\Http\Requests\System\Session;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkAttendanceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'items'                        => ['required', 'array', 'min:1'],
            'items.*.session_id'           => ['required', 'integer', 'exists:sys_sessions,id'],
            'items.*.status'               => ['required', Rule::in(['attended', 'absent', 'cancelled'])],
            'items.*.cancelled_by'         => ['nullable', Rule::in(['student', 'teacher', 'admin'])],
            'items.*.cancellation_reason'  => ['nullable', 'string', 'max:500'],
        ];
    }
}
