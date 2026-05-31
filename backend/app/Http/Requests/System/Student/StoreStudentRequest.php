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
            'whatsapp'              => ['nullable', 'string', 'max:64'],
            'country'               => ['required', 'string', 'size:2'],
            'timezone'              => ['required', 'timezone'],
            'student_type'          => ['required', 'in:child,adult'],
            // Child: either link existing guardian or create a new one
            'guardian_id'           => ['nullable', 'integer', 'exists:sys_guardians,id'],
            'guardian_name'         => ['required_if:student_type,child', 'nullable', 'string', 'max:255'],
            'guardian_whatsapp'     => ['required_if:student_type,child', 'nullable', 'string', 'max:32'],
            'course_id'             => ['nullable', 'integer', 'exists:courses,id'],
            'assigned_teacher_id'   => ['nullable', 'integer', 'exists:sys_teachers,id'],
            'sessions_per_month'    => ['nullable', 'integer', 'min:0', 'max:60'],
            'session_duration_min'  => ['nullable', 'in:30,45,60'],
            'currency'              => ['nullable', 'string', 'size:3'],
            'monthly_price_minor'   => ['nullable', 'integer', 'min:0'],
            'custom_discount_pct'   => ['nullable', 'integer', 'between:0,100'],
            'source'                => ['nullable', 'in:lead,manual,referral,trial_booking'],
            'trial_booking_id'      => ['nullable', 'integer', 'exists:trial_bookings,id'],
            'note'                  => ['nullable', 'string', 'max:5000'],
        ];
    }
}
