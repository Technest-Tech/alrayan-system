<?php

namespace App\Http\Requests\System\LeadFollowUp;

use Illuminate\Foundation\Http\FormRequest;

class CompleteFollowUpRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'completion_notes' => 'nullable|string|max:1000',
        ];
    }
}
