<?php

namespace App\Http\Requests\System\SchedulePattern;

use Illuminate\Foundation\Http\FormRequest;

class ReplaceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'effective_date'             => ['required', 'date', 'after_or_equal:today'],
            'patterns'                   => ['required', 'array', 'min:1'],
            'patterns.*.day_of_week'     => ['required', 'integer', 'between:0,6'],
            'patterns.*.start_time'      => ['required', 'date_format:H:i'],
            'patterns.*.duration_min'    => ['required', 'integer', 'in:30,45,60'],
            'patterns.*.valid_to'        => ['nullable', 'date'],
            'force_conflicts'            => ['boolean'],
        ];
    }
}
