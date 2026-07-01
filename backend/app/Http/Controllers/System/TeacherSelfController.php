<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\UpdateMeProfileRequest;
use App\Http\Resources\System\PayrollDetailResource;
use App\Http\Resources\System\PayrollResource;
use App\Http\Resources\System\StudentResource;
use App\Models\System\Teacher;
use App\Services\System\SalaryStatementBuilder;
use App\Services\System\UserProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Self-service endpoints for the authenticated teacher's own portal. Every
 * action resolves the teacher from the auth token (never a route id), so no
 * permission gate is needed — a teacher can only ever act on their own record.
 */
class TeacherSelfController extends Controller
{
    private function currentTeacher(): Teacher
    {
        $teacher = auth()->user()->teacher;
        abort_unless($teacher, 403, 'No teacher profile linked to this account.');

        return $teacher;
    }

    /** The teacher's own students, for the "My Students" card grid. */
    public function students(): AnonymousResourceCollection
    {
        $teacher = $this->currentTeacher();

        $students = $teacher->students()
            ->with(['course', 'guardian'])
            ->orderBy('name')
            ->get();

        return StudentResource::collection($students);
    }

    /** The teacher's own profile (user identity + teacher payment fields). */
    public function profile(): JsonResponse
    {
        $teacher = $this->currentTeacher();

        return response()->json(['data' => $this->profilePayload($teacher)]);
    }

    /** Update the teacher's own profile — locked to a safe self-service field set. */
    public function updateProfile(UpdateMeProfileRequest $request, UserProvisioner $provisioner): JsonResponse
    {
        $teacher = $this->currentTeacher();
        $data    = $request->validated();

        $provisioner->update($teacher->user, array_intersect_key($data, array_flip([
            'name', 'phone', 'whatsapp', 'birthday', 'gender', 'language', 'photo_url', 'documents', 'relatives',
        ])));

        $teacher->fill(array_intersect_key($data, array_flip([
            'payment_method', 'payment_account_details',
        ])))->save();

        return response()->json(['data' => $this->profilePayload($teacher->fresh('user'))]);
    }

    /** The teacher's own salary statement (current period + history). */
    public function salaryStatement(Request $request, SalaryStatementBuilder $builder): JsonResponse
    {
        $teacher = $this->currentTeacher();

        $stmt = $builder->forTeacher($teacher, $request->integer('year') ?: null, $request->integer('month') ?: null);

        return response()->json([
            'teacher' => [
                'id'             => $stmt->teacher->id,
                'name'           => $stmt->teacher->user->name,
                'payment_method' => $stmt->teacher->payment_method,
            ],
            'current' => $stmt->current ? new PayrollDetailResource($stmt->current) : null,
            'history' => PayrollResource::collection($stmt->history),
        ]);
    }

    /** @return array<string,mixed> */
    private function profilePayload(Teacher $teacher): array
    {
        $user = $teacher->user;

        return [
            'id'                      => $teacher->id,
            'user_id'                 => $user->id,
            'name'                    => $user->name,
            'email'                   => $user->email,
            'phone'                   => $user->phone,
            'whatsapp'                => $user->whatsapp,
            'birthday'                => optional($user->birthday)->toDateString(),
            'gender'                  => $user->gender,
            'language'                => $user->language,
            'photo_url'               => $user->photo_url,
            'documents'               => $user->documents ?? [],
            'relatives'               => $user->relatives ?? [],
            'payment_method'          => $teacher->payment_method,
            'payment_account_details' => $teacher->payment_account_details,
            'status'                  => $user->status,
            'role'                    => $user->role,
            'is_active'               => (bool) $user->is_active,
            'member_since'            => optional($user->created_at)->toIso8601String(),
        ];
    }
}
