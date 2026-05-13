<?php

namespace App\Http\Requests\System\Lead;

use Illuminate\Foundation\Http\FormRequest;

class AssignLeadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'supervisor_id' => 'required|exists:users,id',
        ];
    }
}
