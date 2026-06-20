<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Unified directory row: shared identity for every person, plus a role-specific
 * `profile` sub-object.
 */
class UserDirectoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'email'          => $this->email,
            'phone'          => $this->phone,
            'whatsapp'       => $this->whatsapp,
            'role'           => $this->role,
            'roles'          => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')->values()),
            'permissions'    => $this->whenLoaded('permissions', fn () => $this->permissions->pluck('name')->values()),
            'status'         => $this->status,
            'is_active'      => $this->is_active,
            'language'       => $this->language,
            'birthday'       => $this->birthday?->toDateString(),
            'gender'         => $this->gender,
            'photo_url'      => $this->photo_url,
            'notes'          => $this->notes,
            'documents'      => $this->documents,
            'emails'         => $this->whenLoaded('emails', fn () => $this->emails->map(fn ($e) => [
                'email'      => $e->email,
                'label'      => $e->label,
                'is_primary' => $e->is_primary,
            ])->values()),
            'phones'         => $this->whenLoaded('phones', fn () => $this->phones->map(fn ($p) => [
                'phone'      => $p->phone,
                'type'       => $p->type,
                'label'      => $p->label,
                'is_primary' => $p->is_primary,
            ])->values()),
            'last_login_at'  => $this->last_login_at?->toISOString(),
            'invite_pending' => ! $this->last_login_at && $this->status === 'active',
            'profile'        => $this->profile(),
            'created_at'     => $this->created_at?->toISOString(),
        ];
    }

    private function profile(): ?array
    {
        return match ($this->role) {
            'student' => $this->whenLoaded('studentProfile', fn () => $this->studentProfile ? [
                'id'                   => $this->studentProfile->id,
                'student_type'         => $this->studentProfile->student_type,
                'country'              => $this->studentProfile->country,
                'timezone'             => $this->studentProfile->timezone,
                'status'               => $this->studentProfile->status,
                'sessions_per_month'   => $this->studentProfile->sessions_per_month,
                'session_duration_min' => $this->studentProfile->session_duration_min,
                'currency'             => $this->studentProfile->currency,
                'monthly_price_minor'  => $this->studentProfile->monthly_price_minor,
                'package_hours_default' => $this->studentProfile->package_hours_default,
                'hourly_rate_minor'    => $this->studentProfile->hourly_rate_minor,
                'source'               => $this->studentProfile->source,
                'course'               => $this->studentProfile->relationLoaded('course') && $this->studentProfile->course ? [
                    'id'   => $this->studentProfile->course->id,
                    'name' => $this->studentProfile->course->title,
                ] : null,
                'assigned_teacher'     => $this->studentProfile->relationLoaded('assignedTeacher') && $this->studentProfile->assignedTeacher ? [
                    'id'   => $this->studentProfile->assignedTeacher->id,
                    'name' => optional($this->studentProfile->assignedTeacher->user)->name,
                ] : null,
                'guardian'             => $this->studentProfile->relationLoaded('guardian') && $this->studentProfile->guardian ? [
                    'id'       => $this->studentProfile->guardian->id,
                    'name'     => $this->studentProfile->guardian->name,
                    'whatsapp' => $this->studentProfile->guardian->whatsapp,
                ] : null,
            ] : null),
            'teacher' => $this->whenLoaded('teacherProfile', fn () => $this->teacherProfile ? [
                'id'                   => $this->teacherProfile->id,
                'qualifications'       => $this->teacherProfile->qualifications,
                'payment_method'       => $this->teacherProfile->payment_method,
                'hourly_rate'          => $this->teacherProfile->hourly_rate,
                'currency'             => $this->teacherProfile->currency,
                'accepts_new_students' => $this->teacherProfile->accepts_new_students,
                'teachable_course_ids' => $this->teacherProfile->teachable_course_ids,
                'is_active'            => $this->teacherProfile->is_active,
                'students_count'       => $this->teacherProfile->students_count ?? null,
            ] : null),
            'parent' => $this->whenLoaded('guardianProfile', fn () => $this->guardianProfile ? [
                'id'       => $this->guardianProfile->id,
                'whatsapp' => $this->guardianProfile->whatsapp,
            ] : null),
            default => null,
        };
    }
}
