<?php

namespace App\Http\Requests\System\Task;

use App\Models\System\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'type'             => ['nullable', Rule::in(Task::TYPES)],
            'title'            => ['required', 'string', 'max:200'],
            'body'             => ['nullable', 'string', 'max:5000'],
            'priority'         => ['nullable', Rule::in(Task::PRIORITIES)],
            'status'           => ['nullable', Rule::in(Task::STATUSES)],
            'assignee_role'    => ['nullable', 'string', 'max:32'],
            'assignee_user_id' => ['nullable', 'exists:users,id'],
            'student_id'       => ['nullable', 'exists:sys_students,id'],
            'teacher_id'       => ['nullable', 'exists:sys_teachers,id'],
            'due_at'           => ['nullable', 'date'],
            'payload'          => ['nullable', 'array'],
        ];
    }
}
