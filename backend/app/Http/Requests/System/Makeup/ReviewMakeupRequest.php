<?php

namespace App\Http\Requests\System\Makeup;

use Illuminate\Foundation\Http\FormRequest;

class ReviewMakeupRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'review_note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
