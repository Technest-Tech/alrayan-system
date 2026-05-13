<?php

namespace App\Http\Requests\System\LeadFollowUp;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFollowUpRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'due_at' => 'sometimes|date',
            'action' => 'sometimes|string|max:200',
            'notes'  => 'nullable|string|max:1000',
        ];
    }
}
