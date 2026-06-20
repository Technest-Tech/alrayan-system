<?php

namespace App\Http\Requests\System\Task;

use Illuminate\Foundation\Http\FormRequest;

class AssignTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'assignee_role'    => ['nullable', 'string', 'max:32'],
            'assignee_user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
