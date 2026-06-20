<?php

namespace App\Http\Requests\System\Task;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskNoteRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:5000'],
        ];
    }
}
