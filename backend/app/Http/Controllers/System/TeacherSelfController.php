<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\UpdateMeProfileRequest;
use App\Http\Resources\System\PayrollDetailResource;
use App\Http\Resources\System\PayrollResource;
use App\Http\Resources\System\StudentResource;
use App\Models\System\Teacher;
use App\Services\System\LessonMetrics;
use App\Services\System\SalaryStatementBuilder;
use App\Services\System\SalaryTiers;
use App\Services\System\UserProvisioner;
use Carbon\Carbon;
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

    /**
     * Where the teacher stands on the hour ladder this month: hours taught,
     * the tier (and rate) those hours have earned, how far the next tier is,
     * and the last 6 months of attained tiers.
     */
    public function salaryTier(Request $request, LessonMetrics $metrics, SalaryTiers $tiers): JsonResponse
    {
        $teacher = $this->currentTeacher();

        $now   = Carbon::now();
        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
        ]);
        $month = $validated['month'] ?? null;
        $start = is_string($month) && preg_match('/^\d{4}-\d{2}$/', $month)
            ? Carbon::createFromFormat('Y-m-d', $month . '-01')->startOfMonth()
            : $now->copy()->startOfMonth();
        $end = $start->copy()->endOfMonth();
        if ($end->greaterThan($now)) $end = $now->copy();

        $row      = $metrics->bucketedByTeacher($start, $end)->get($teacher->id);
        $hours    = round((int) ($row->total_min ?? 0) / 60, 2);
        $progress = $tiers->progress($hours);

        // Attained tier per month, oldest first — the ladder as a track record.
        $history = [];
        foreach (array_reverse(range(0, 5)) as $back) {
            $mStart = $now->copy()->subMonths($back)->startOfMonth();
            $mEnd   = $mStart->copy()->endOfMonth();
            if ($mEnd->greaterThan($now)) $mEnd = $now->copy();

            $mHours = $metrics->hoursForTeacher($teacher->id, $mStart, $mEnd);
            $mTier  = $tiers->tierForHours($mHours);

            $history[] = [
                'month'        => $mStart->format('Y-m'),
                'label'        => $mStart->format('M Y'),
                'hours'        => $mHours,
                'tier_index'   => $mTier['index'],
                'rate_minor'   => $mTier['rate_minor'],
                'salary_minor' => $tiers->salaryMinor($mHours),
            ];
        }

        return response()->json([
            'month'                  => $start->format('Y-m'),
            'currency'               => SalaryTiers::CURRENCY,
            'hours'                  => $progress['hours'],
            'lessons'                => (int) ($row->lessons ?? 0),
            'tier'                   => $progress['tier'],
            'next_tier'              => $progress['next_tier'],
            'hours_to_next'          => $progress['hours_to_next'],
            'progress_pct'           => $progress['progress_pct'],
            'rate_minor'             => $progress['rate_minor'],
            'salary_minor'           => $progress['salary_minor'],
            'next_tier_salary_minor' => $progress['next_tier_salary_minor'],
            'ladder'                 => $tiers->ladder(),
            'history'                => $history,
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
