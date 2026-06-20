<?php

namespace App\Http\Requests\System\Task;

use Illuminate\Foundation\Http\FormRequest;

class PostponeTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'due_at' => ['nullable', 'date'],
        ];
    }
}
