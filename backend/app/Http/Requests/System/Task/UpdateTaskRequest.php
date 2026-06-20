<?php

namespace App\Http\Requests\System\Task;

use App\Models\System\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title'            => ['sometimes', 'string', 'max:200'],
            'body'             => ['sometimes', 'nullable', 'string', 'max:5000'],
            'status'           => ['sometimes', Rule::in(Task::STATUSES)],
            'priority'         => ['sometimes', Rule::in(Task::PRIORITIES)],
            'assignee_role'    => ['sometimes', 'nullable', 'string', 'max:32'],
            'assignee_user_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'due_at'           => ['sometimes', 'nullable', 'date'],
            'payload'          => ['sometimes', 'nullable', 'array'],
        ];
    }
}
