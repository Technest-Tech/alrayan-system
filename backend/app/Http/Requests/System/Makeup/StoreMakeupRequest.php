<?php

namespace App\Http\Requests\System\Makeup;

use Illuminate\Foundation\Http\FormRequest;

class StoreMakeupRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'original_session_id'   => ['required', 'integer', 'exists:sys_sessions,id'],
            'proposed_start_at'     => ['required', 'date', 'after:now'],
            'proposed_duration_min' => ['required', 'integer', 'in:30,45,60'],
            'reason'                => ['nullable', 'string', 'max:500'],
        ];
    }
}
