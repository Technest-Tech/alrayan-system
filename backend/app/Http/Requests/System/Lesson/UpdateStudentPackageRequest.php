<?php

namespace App\Http\Requests\System\Lesson;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentPackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tariff_at_time'       => ['sometimes', 'integer', 'min:0'],
            'package_hours'        => ['sometimes', 'integer', 'min:1'],
            'status'               => ['sometimes', 'string', 'in:pending,paid,suspended'],
            'needs_reconfirmation' => ['sometimes', 'boolean'],
            'notes'                => ['sometimes', 'nullable', 'string', 'max:2000'],
            // The day the money came in. Only meaningful on a paid package (the controller
            // clears it when a package goes back to pending). Not in the future — with a day's
            // leeway, since the server runs on UTC and the staff's "today" can be a day ahead.
            'paid_at'              => ['sometimes', 'nullable', 'date', 'before_or_equal:tomorrow'],
        ];
    }
}
