<?php

namespace App\Http\Requests\System\Student;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['nullable', 'email', 'unique:sys_students,email'],
            'phone'                 => ['nullable', 'string', 'max:32'],
            'whatsapp'              => ['nullable', 'string', 'max:32'],
            'country'               => ['required', 'string', 'size:2'],
            'timezone'              => ['required', 'timezone'],
            'age_category'          => ['required', 'in:child,adult'],
            'parent_name'           => ['required_if:age_category,child', 'nullable', 'string', 'max:255'],
            'parent_phone'          => ['required_if:age_category,child', 'nullable', 'string', 'max:32'],
            'parent_whatsapp'       => ['nullable', 'string', 'max:32'],
            'parent_email'          => ['nullable', 'email'],
            'course_id'             => ['nullable', 'integer', 'exists:courses,id'],
            'assigned_teacher_id'   => ['nullable', 'integer', 'exists:sys_teachers,id'],
            'sessions_per_month'    => ['required', 'integer', 'min:0', 'max:60'],
            'session_duration_min'  => ['required', 'in:30,45,60'],
            'currency'              => ['required', 'string', 'size:3'],
            'monthly_price_minor'   => ['required', 'integer', 'min:0'],
            'custom_discount_pct'   => ['nullable', 'integer', 'between:0,100'],
            'source'                => ['nullable', 'in:lead,manual,referral,trial_booking'],
            'trial_booking_id'      => ['nullable', 'integer', 'exists:trial_bookings,id'],
            'note'                  => ['nullable', 'string', 'max:5000'],
        ];
    }
}
