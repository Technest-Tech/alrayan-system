<?php

namespace App\Http\Requests\System\MessageTemplate;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMessageTemplateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'body'      => 'sometimes|string|max:2000',
            'label'     => 'sometimes|string|max:120',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
