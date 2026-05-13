<?php

namespace App\Http\Requests\System\WhatsAppGroup;

use Illuminate\Foundation\Http\FormRequest;

class StoreWhatsAppGroupRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'type'               => 'required|in:student,teacher',
            'invite_link'        => 'required|url|max:500',
            'status'             => 'sometimes|in:active,stopped',
            'linked_student_id'  => 'nullable|exists:sys_students,id',
            'linked_teacher_id'  => 'nullable|exists:sys_teachers,id',
            'external_group_id'  => 'nullable|string|max:100',
        ];
    }
}
