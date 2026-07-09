<?php

namespace App\Services\System;

use App\Models\System\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Creates a teacher together with its unified `users` identity row (role=teacher),
 * and the teacher profile (rates/payment). Shared by the legacy
 * TeacherController and the unified user-directory endpoint.
 */
class TeacherCreator
{
    public function __construct(private readonly UserProvisioner $provisioner) {}

    /**
     * @param  array<string,mixed>  $data
     */
    public function create(array $data, ?int $actorId = null): Teacher
    {
        return DB::transaction(function () use ($data) {
            // A teacher always signs in, so the admin sets the password at creation.
            // There is no invite email: mail delivery is disabled in this deployment.
            $password = $data['password'] ?? null;

            $user = $this->provisioner->create([
                'name'      => $data['name'],
                'email'     => $data['email'],
                'password'  => $password,
                'phone'     => $data['phone'] ?? null,
                'whatsapp'  => $data['whatsapp'] ?? null,
                'status'    => $data['status'] ?? 'active',
                'language'  => $data['language'] ?? null,
                'birthday'  => $data['birthday'] ?? null,
                'gender'    => $data['gender'] ?? null,
                'photo_url' => $data['photo_url'] ?? null,
                'notes'     => $data['notes'] ?? null,
                'documents' => $data['documents'] ?? null,
                'emails'    => $data['emails'] ?? [],
                'phones'    => $data['phones'] ?? [],
            ], 'teacher');

            $perMinute = (int) round(($data['hourly_rate'] ?? 0) / 60);

            return Teacher::create([
                'user_id'                 => $user->id,
                'qualifications'          => $data['qualifications'] ?? null,
                'cv_url'                  => $data['cv_url'] ?? null,
                'teachable_course_ids'    => $data['teachable_course_ids'] ?? [],
                'payment_method'          => $data['payment_method'],
                'payment_account_details' => $data['payment_account_details'] ?? null,
                'accepts_new_students'    => $data['accepts_new_students'] ?? true,
                'currency'                => $data['currency'] ?? null,
                'hourly_rate'             => $data['hourly_rate'] ?? 0,
                'per_minute_rate_30'      => $perMinute,
                'per_minute_rate_45'      => $perMinute,
                'per_minute_rate_60'      => $perMinute,
            ]);
        });
    }
}
