<?php

namespace App\Http\Requests\System\NotificationPreferences;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePreferencesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'muted_types'   => 'required|array',
            'muted_types.*' => 'string',
        ];
    }
}
