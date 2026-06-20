<?php

namespace App\Http\Requests\System\Users;

use App\Support\System\Permissions\PermissionRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Partial update of a unified user's shared identity (and optionally its role,
 * contacts, and permissions) from the user directory.
 */
class UpdateUserDirectoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'role'        => ['sometimes', Rule::in(StoreUserRequest::ROLES)],
            'name'        => ['sometimes', 'string', 'max:255'],
            'email'       => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'emails'      => ['sometimes', 'array'],
            'emails.*'    => ['email'],
            'phone'       => ['nullable', 'string', 'max:32'],
            'whatsapp'    => ['nullable', 'string', 'max:64'],
            'phones'      => ['sometimes', 'array'],
            'phones.*'    => ['string', 'max:32'],
            'status'      => ['sometimes', Rule::in(['active', 'inactive', 'suspended', 'archived'])],
            'language'    => ['nullable', 'string', 'max:8'],
            'birthday'    => ['nullable', 'date'],
            'gender'      => ['nullable', 'in:male,female'],
            'photo_url'   => ['nullable', 'string', 'max:2048'],
            'notes'       => ['nullable', 'string'],
            'documents'   => ['nullable', 'array'],
            'permissions'   => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::in(PermissionRegistry::all())],

            // Student profile (patched when the user is a student)
            'student_type'          => ['sometimes', 'in:child,adult'],
            'country'               => ['sometimes', 'string', 'size:2'],
            'timezone'              => ['sometimes', 'timezone'],
            'course_id'             => ['sometimes', 'nullable', 'integer', 'exists:courses,id'],
            'assigned_teacher_id'   => ['sometimes', 'nullable', 'integer', 'exists:sys_teachers,id'],
            'sessions_per_month'    => ['sometimes', 'nullable', 'integer', 'min:0', 'max:60'],
            'session_duration_min'  => ['sometimes', 'nullable', 'in:30,45,60'],
            'currency'              => ['sometimes', 'nullable', 'string', 'size:3'],
            'monthly_price_minor'   => ['sometimes', 'nullable', 'integer', 'min:0'],
            'package_hours_default' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:1000'],
            'hourly_rate_minor'     => ['sometimes', 'nullable', 'integer', 'min:0'],
            'source'                => ['sometimes', 'nullable', 'in:lead,manual,referral,trial_booking'],
            'guardian_id'           => ['sometimes', 'nullable', 'integer', 'exists:sys_guardians,id'],

            // Teacher profile (patched when the user is a teacher)
            'payment_method'          => ['sometimes', 'in:vodafone_cash,instapay,wallet_other'],
            'hourly_rate'             => ['sometimes', 'nullable', 'integer', 'min:0'],
            'accepts_new_students'    => ['sometimes', 'boolean'],
            'qualifications'          => ['sometimes', 'nullable', 'string'],
            'payment_account_details' => ['sometimes', 'nullable', 'string', 'max:500'],
            'teachable_course_ids'    => ['sometimes', 'nullable', 'array'],
            'teachable_course_ids.*'  => ['integer', 'exists:courses,id'],
        ];
    }
}
