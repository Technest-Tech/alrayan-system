<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Users\StoreUserRequest;
use App\Http\Requests\System\Users\UpdateUserDirectoryRequest;
use App\Http\Resources\System\UserDirectoryResource;
use App\Models\System\Guardian;
use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Models\User;
use App\Notifications\System\SystemUserInvitedNotification;
use App\Services\System\AuditLog;
use App\Services\System\StudentCreator;
use App\Services\System\TeacherCreator;
use App\Services\System\UserProvisioner;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class UserDirectoryController extends Controller
{
    private const STAFF_ROLES = ['admin', 'supervisor', 'quality', 'accountant'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $users = QueryBuilder::for(User::class)
            ->allowedFilters([
                AllowedFilter::exact('role'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('language'),
                AllowedFilter::callback('q', fn ($query, $value) => $query->where(function ($q) use ($value) {
                    $q->where('name', 'like', "%{$value}%")
                      ->orWhere('email', 'like', "%{$value}%")
                      ->orWhere('whatsapp', 'like', "%{$value}%")
                      ->orWhereHas('emails', fn ($e) => $e->where('email', 'like', "%{$value}%"))
                      ->orWhereHas('phones', fn ($p) => $p->where('phone', 'like', "%{$value}%"));
                })),
                AllowedFilter::callback('activity', fn ($query, $value) => (int) $value === 30
                    ? $query->where('last_login_at', '>=', now()->subDays(30))
                    : $query),
                AllowedFilter::callback('assigned_teacher', fn ($query, $value) => $query->whereHas(
                    'studentProfile',
                    fn ($s) => $s->where('assigned_teacher_id', $value),
                )),
                AllowedFilter::callback('course', fn ($query, $value) => $query->where(function ($q) use ($value) {
                    $q->whereHas('studentProfile', fn ($s) => $s->where('course_id', $value))
                      ->orWhereHas('teacherProfile', fn ($t) => $t->whereJsonContains('teachable_course_ids', (int) $value));
                })),
            ])
            ->allowedSorts([
                AllowedSort::field('name'),
                AllowedSort::field('created_at'),
                AllowedSort::field('last_login_at'),
            ])
            ->defaultSort('name')
            ->with([
                'roles',
                'emails',
                'phones',
                'studentProfile.course',
                'studentProfile.assignedTeacher.user',
                'studentProfile.guardian',
                'teacherProfile',
                'guardianProfile',
            ])
            ->paginate($request->integer('per_page', 25))
            ->appends($request->query());

        return UserDirectoryResource::collection($users);
    }

    public function stats(): JsonResponse
    {
        $byRole   = User::selectRaw('role, count(*) as c')->groupBy('role')->pluck('c', 'role');
        $byStatus = User::selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status');

        $roleCount = fn (array $roles) => collect($roles)->sum(fn ($r) => (int) ($byRole[$r] ?? 0));

        return response()->json([
            'total'     => (int) $byRole->sum(),
            'students'  => (int) ($byRole['student'] ?? 0),
            'teachers'  => (int) ($byRole['teacher'] ?? 0),
            'parents'   => (int) ($byRole['parent'] ?? 0),
            'staff'     => $roleCount(self::STAFF_ROLES),
            'active'    => (int) ($byStatus['active'] ?? 0),
            'inactive'  => (int) ($byStatus['inactive'] ?? 0),
            'suspended' => (int) ($byStatus['suspended'] ?? 0),
            'archived'  => (int) ($byStatus['archived'] ?? 0),
        ]);
    }

    public function show(int $id): UserDirectoryResource
    {
        $user = User::with([
            'roles', 'permissions', 'emails', 'phones',
            'studentProfile.course', 'studentProfile.assignedTeacher.user', 'studentProfile.guardian',
            'teacherProfile', 'guardianProfile',
        ])->findOrFail($id);

        return new UserDirectoryResource($user);
    }

    public function store(StoreUserRequest $request, StudentCreator $students, TeacherCreator $teachers, UserProvisioner $provisioner): JsonResponse
    {
        $data = $request->validated();
        $role = $data['role'];

        $user = DB::transaction(function () use ($data, $role, $students, $teachers, $provisioner) {
            $user = match ($role) {
                'student' => $students->create($data, auth()->id())->user,
                'teacher' => $teachers->create($data, auth()->id())->user,
                'parent'  => $this->createParent($data, $provisioner),
                default   => $this->createStaff($data, $role, $provisioner),
            };

            AuditLog::record('users.created', $user, ['role' => $role]);

            return $user;
        });

        return (new UserDirectoryResource($this->loadDirectory($user)))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateUserDirectoryRequest $request, UserProvisioner $provisioner, int $id): UserDirectoryResource
    {
        $user = User::findOrFail($id);
        $data = $request->validated();

        if (array_key_exists('role', $data) && $data['role'] !== $user->role) {
            $old = $user->role;
            $user->role = $data['role'];
            $user->syncRoles([$data['role']]);
            AuditLog::record('users.role_changed', $user, ['old' => $old, 'new' => $data['role']]);
        }

        $provisioner->update($user, $data);
        $this->updateProfile($user->fresh(), $data);

        return new UserDirectoryResource($this->loadDirectory($user->fresh()));
    }

    /**
     * Persist role-specific profile changes (student / teacher) on edit.
     */
    private function updateProfile(User $user, array $data): void
    {
        if ($user->role === 'student' && $user->studentProfile) {
            $fields = array_intersect_key($data, array_flip([
                'student_type', 'country', 'timezone', 'course_id', 'assigned_teacher_id',
                'sessions_per_month', 'session_duration_min', 'currency', 'monthly_price_minor',
                'package_hours_default', 'hourly_rate_minor', 'source', 'guardian_id',
            ]));
            if ($fields) {
                $user->studentProfile->update($fields);
            }
        }

        if ($user->role === 'teacher' && $user->teacherProfile) {
            $fields = array_intersect_key($data, array_flip([
                'payment_method', 'qualifications', 'payment_account_details', 'teachable_course_ids',
                'accepts_new_students', 'currency',
            ]));
            if (array_key_exists('hourly_rate', $data) && $data['hourly_rate'] !== null) {
                $perMinute = (int) round($data['hourly_rate'] / 60);
                $fields['hourly_rate'] = $data['hourly_rate'];
                $fields['per_minute_rate_30'] = $perMinute;
                $fields['per_minute_rate_45'] = $perMinute;
                $fields['per_minute_rate_60'] = $perMinute;
            }
            if ($fields) {
                $user->teacherProfile->update($fields);
            }
        }
    }

    public function activate(int $id): UserDirectoryResource
    {
        $user = User::findOrFail($id);
        $user->syncStatus('active');
        AuditLog::record('users.activated', $user);

        return new UserDirectoryResource($this->loadDirectory($user));
    }

    public function deactivate(Request $request, int $id): JsonResponse|UserDirectoryResource
    {
        return $this->transition($request, $id, 'inactive', 'users.deactivated');
    }

    public function suspend(Request $request, int $id): JsonResponse|UserDirectoryResource
    {
        return $this->transition($request, $id, 'suspended', 'users.suspended');
    }

    public function archive(Request $request, int $id): JsonResponse|UserDirectoryResource
    {
        return $this->transition($request, $id, 'archived', 'users.archived');
    }

    private function transition(Request $request, int $id, string $status, string $event): JsonResponse|UserDirectoryResource
    {
        if ($request->user()->id === $id) {
            return response()->json(['message' => 'You cannot change your own account status.'], 422);
        }

        $user = User::with('teacherProfile')->findOrFail($id);

        if ($user->teacherProfile && $user->teacherProfile->students()->exists()) {
            return response()->json([
                'message' => 'Cannot suspend or archive a teacher with assigned students. Reassign their students first.',
            ], 422);
        }

        $user->syncStatus($status);
        AuditLog::record($event, $user);

        return new UserDirectoryResource($this->loadDirectory($user));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($request->user()->id === $id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $user = User::with(['studentProfile', 'guardianProfile'])->findOrFail($id);

        // withTrashed: a soft-deleted teacher row still exists, and sys_teachers.user_id
        // cascades off users.id — deleting the user would silently take it (and its
        // sessions/reports/reviews/schedules) with it.
        $teacher = Teacher::withTrashed()->where('user_id', $user->id)->first();
        if ($teacher) {
            return $this->destroyTeacher($user, $teacher);
        }

        DB::transaction(function () use ($user) {
            // Soft-delete the student profile (preserves billing/scheduling history),
            // hard-delete the guardian profile, then remove the user. The additive
            // user_id FKs are nullOnDelete so nothing else breaks.
            $user->studentProfile?->delete();
            $user->guardianProfile?->delete();
            AuditLog::record('users.deleted', $user, ['role' => $user->role]);
            $user->delete();
        });

        return response()->json(['deleted' => true]);
    }

    /**
     * Permanently remove a teacher — and only the teacher.
     *
     * sys_lessons, sys_sessions, sys_session_reports, sys_lesson_schedules and sys_payrolls all
     * hold teacher_id nullOnDelete, so those records survive and simply lose their link. The
     * cascade takes only what belongs to the teacher: their quality reviews, availability, notes
     * and leaves. Students are unassigned, never deleted, and their packages are untouched —
     * consumption is derived from lessons, and the lessons stay.
     */
    private function destroyTeacher(User $user, Teacher $teacher): JsonResponse
    {
        try {
            $unassigned = DB::transaction(function () use ($user, $teacher) {
                $unassigned = $this->unassignStudents($teacher);

                AuditLog::record('users.deleted', $user, [
                    'role'                => $user->role,
                    'students_unassigned' => $unassigned,
                ]);

                // Cascades sys_teachers off users.id; every other FK nulls out.
                $user->delete();

                return $unassigned;
            });
        } catch (QueryException $e) {
            // Something still holds a hard reference. Say what, instead of a bare 500.
            return response()->json([
                'deleted' => false,
                'message' => 'Could not delete this teacher — another record still references them: '
                    . $e->getMessage(),
            ], 409);
        }

        return response()->json(['deleted' => true, 'students_unassigned' => $unassigned]);
    }

    private function unassignStudents(Teacher $teacher): int
    {
        return Student::where('assigned_teacher_id', $teacher->id)
            ->update(['assigned_teacher_id' => null]);
    }

    private function createParent(array $data, UserProvisioner $provisioner): User
    {
        // Parents have no real email — synthesize a unique one.
        $data['email'] = $data['email'] ?? \App\Support\System\IdentityEmail::forGuardian($data['name']);

        $user = $provisioner->create($data, 'parent');

        Guardian::create([
            'user_id'  => $user->id,
            'name'     => $data['name'],
            'whatsapp' => $data['whatsapp'] ?? null,
        ]);

        return $user;
    }

    private function createStaff(array $data, string $role, UserProvisioner $provisioner): User
    {
        $user = $provisioner->create($data, $role);

        // Invite flow: send a password-set link.
        $token = Password::createToken($user);
        $url   = config('system.frontend_url') . '/reset-password/' . $token . '?email=' . urlencode($user->email);
        $user->notify(new SystemUserInvitedNotification($url, auth()->user()));

        return $user;
    }

    private function loadDirectory(User $user): User
    {
        return $user->load([
            'roles', 'permissions', 'emails', 'phones',
            'studentProfile.course', 'studentProfile.assignedTeacher.user', 'studentProfile.guardian',
            'teacherProfile', 'guardianProfile',
        ]);
    }
}
