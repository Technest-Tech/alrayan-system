<?php

namespace App\Http\Requests\System\Teacher;

use Illuminate\Foundation\Http\FormRequest;

class AvailabilityRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'availability'              => ['required', 'array'],
            'availability.*.day_of_week'=> ['required', 'integer', 'between:0,6'],
            'availability.*.start_time' => ['required', 'date_format:H:i'],
            'availability.*.end_time'   => ['required', 'date_format:H:i', 'after:availability.*.start_time'],
            'timezone'                  => ['required', 'timezone'],
        ];
    }
}
