<?php

namespace App\Http\Requests\System\Lead;

use Illuminate\Foundation\Http\FormRequest;

class MarkLostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'lost_reason' => 'required|in:price,schedule,teacher,no_response,personal,quality,other',
            'lost_notes'  => 'nullable|string|max:1000',
        ];
    }
}
