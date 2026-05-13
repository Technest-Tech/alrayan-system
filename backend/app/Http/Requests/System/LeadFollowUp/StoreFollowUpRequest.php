<?php

namespace App\Http\Requests\System\LeadFollowUp;

use Illuminate\Foundation\Http\FormRequest;

class StoreFollowUpRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'due_at' => 'required|date|after:now',
            'action' => 'required|string|max:200',
            'notes'  => 'nullable|string|max:1000',
        ];
    }
}
