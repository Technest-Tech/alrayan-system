<?php

namespace App\Http\Requests\System\Users;

use App\Support\System\Permissions\PermissionRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public const ROLES = ['admin', 'supervisor', 'quality', 'teacher', 'accountant', 'parent', 'student'];

    /** Roles that authenticate and therefore require a real, unique email. */
    public const LOGIN_ROLES = ['admin', 'supervisor', 'quality', 'teacher', 'accountant'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Shared identity
            'role'        => ['required', Rule::in(self::ROLES)],
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['nullable', 'email', 'unique:users,email'],
            'emails'      => ['nullable', 'array'],
            'emails.*'    => ['email'],
            'phone'       => ['nullable', 'string', 'max:32'],
            'whatsapp'    => ['nullable', 'string', 'max:64'],
            'phones'      => ['nullable', 'array'],
            'phones.*'    => ['string', 'max:32'],
            'password'    => ['nullable', 'string', 'min:8'],
            'status'      => ['nullable', Rule::in(['active', 'inactive', 'suspended', 'archived'])],
            'language'    => ['nullable', 'string', 'max:8'],
            'birthday'    => ['nullable', 'date'],
            'gender'      => ['nullable', 'in:male,female'],
            'photo_url'   => ['nullable', 'string', 'max:2048'],
            'notes'       => ['nullable', 'string'],
            'documents'   => ['nullable', 'array'],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(PermissionRegistry::all())],

            // Student profile
            'country'              => ['required_if:role,student', 'nullable', 'string', 'size:2'],
            'timezone'             => ['required_if:role,student', 'nullable', 'timezone'],
            'student_type'         => ['required_if:role,student', 'nullable', 'in:child,adult'],
            'guardian_id'          => ['nullable', 'integer', 'exists:sys_guardians,id'],
            'guardian_name'        => ['nullable', 'string', 'max:255'],
            'guardian_whatsapp'    => ['nullable', 'string', 'max:32'],
            'course_id'            => ['nullable', 'integer', 'exists:courses,id'],
            'assigned_teacher_id'  => ['nullable', 'integer', 'exists:sys_teachers,id'],
            'sessions_per_month'   => ['nullable', 'integer', 'min:0', 'max:60'],
            'session_duration_min' => ['nullable', 'in:30,45,60'],
            'currency'              => ['nullable', 'string', 'size:3'],
            'monthly_price_minor'   => ['nullable', 'integer', 'min:0'],
            'package_hours_default' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'hourly_rate_minor'     => ['nullable', 'integer', 'min:0'],
            'custom_discount_pct'   => ['nullable', 'integer', 'between:0,100'],
            'source'                => ['nullable', 'in:lead,manual,referral,trial_booking'],
            'trial_booking_id'     => ['nullable', 'integer', 'exists:trial_bookings,id'],
            'note'                 => ['nullable', 'string', 'max:5000'],

            // Teacher profile
            'payment_method'          => ['required_if:role,teacher', 'nullable', 'in:vodafone_cash,instapay,wallet_other'],
            'hourly_rate'             => ['required_if:role,teacher', 'nullable', 'integer', 'min:0'],
            'accepts_new_students'    => ['nullable', 'boolean'],
            'qualifications'          => ['nullable', 'string'],
            'cv_url'                  => ['nullable', 'url', 'max:2048'],
            'teachable_course_ids'    => ['nullable', 'array'],
            'teachable_course_ids.*'  => ['integer', 'exists:courses,id'],
            'payment_account_details' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator($validator): void
    {
        // Staff/teacher accounts log in, so they need a real, unique email.
        $validator->sometimes(
            'email',
            ['required', 'email', 'unique:users,email'],
            fn ($input) => in_array($input->role, self::LOGIN_ROLES, true),
        );

        // A child student needs a guardian — either an existing one or new details.
        $validator->sometimes(
            ['guardian_name', 'guardian_whatsapp'],
            ['required', 'string'],
            fn ($input) => $input->role === 'student'
                && $input->student_type === 'child'
                && empty($input->guardian_id),
        );
    }
}
