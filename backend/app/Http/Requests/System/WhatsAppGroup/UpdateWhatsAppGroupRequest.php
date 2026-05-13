<?php

namespace App\Http\Requests\System\WhatsAppGroup;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWhatsAppGroupRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'invite_link'       => 'sometimes|url|max:500',
            'linked_student_id' => 'sometimes|nullable|exists:sys_students,id',
            'linked_teacher_id' => 'sometimes|nullable|exists:sys_teachers,id',
            'external_group_id' => 'sometimes|nullable|string|max:100',
        ];
    }
}
