<?php

namespace App\Http\Requests\System\Lead;

use Illuminate\Foundation\Http\FormRequest;

class ConvertLeadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'course_id'             => 'required|exists:courses,id',
            'assigned_teacher_id'   => 'required|exists:sys_teachers,id',
            'timezone'              => 'required|string|max:60',
            'age_category'          => 'required|in:child,teen,adult',
            'sessions_per_month'    => 'required|integer|min:1|max:30',
            'session_duration_min'  => 'required|integer|in:30,45,60',
            'monthly_price_minor'   => 'required|integer|min:0',
            'currency'              => 'required|string|size:3',
            'parent_name'           => 'nullable|string|max:100',
            'parent_phone'          => 'nullable|string|max:32',
            'parent_whatsapp'       => 'nullable|string|max:32',
            'parent_email'          => 'nullable|email|max:255',
        ];
    }
}
