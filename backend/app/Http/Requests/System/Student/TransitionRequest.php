<?php

namespace App\Http\Requests\System\Student;

use App\Services\System\StudentLifecycle;
use Illuminate\Foundation\Http\FormRequest;

class TransitionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'to'     => ['required', 'in:' . implode(',', array_keys(StudentLifecycle::ALLOWED))],
            'reason' => ['required_if:to,cancelled', 'nullable', 'string', 'max:255'],
            'notes'  => ['nullable', 'string', 'max:500'],
        ];
    }
}
