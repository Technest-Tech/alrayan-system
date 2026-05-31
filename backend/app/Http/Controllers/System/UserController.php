<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Users\InviteUserRequest;
use App\Http\Requests\System\Users\UpdateUserRequest;
use App\Http\Resources\System\UserResource;
use App\Models\System\SysTeacher;
use App\Models\User;
use App\Notifications\System\SystemUserInvitedNotification;
use App\Services\System\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filter = $request->input('filter', []);
        $q      = $filter['q'] ?? null;
        $role   = $filter['role'] ?? null;

        $users = User::with(['roles', 'permissions', 'teacher'])
            ->when($q, fn($query) => $query->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                      ->orWhere('email', 'like', "%{$q}%");
            }))
            ->when($role, fn($query) => $query->where('role', $role))
            ->orderBy('name')
            ->paginate(50);

        return response()->json(UserResource::collection($users)->response()->getData(true));
    }

    public function invite(InviteUserRequest $request): JsonResponse
    {
        $perms = $request->validated('permissions', []);
        $role  = $request->validated('role');

        $user = User::create([
            'name'      => $request->validated('name'),
            'email'     => $request->validated('email'),
            'password'  => Hash::make(Str::random(40)),
            'role'      => $role,
            'is_active' => true,
        ]);

        $user->syncRoles([$role]);
        if (!empty($perms)) {
            $user->syncPermissions($perms);
        }

        if ($role === 'teacher') {
            SysTeacher::create(['user_id' => $user->id, 'is_active' => true]);
        }

        $token = Password::createToken($user);
        $url   = config('system.frontend_url') . '/reset-password/' . $token . '?email=' . urlencode($user->email);
        $user->notify(new SystemUserInvitedNotification($url, auth()->user()));

        AuditLog::record('users.invited', $user, ['role' => $role, 'permissions' => $perms]);

        return response()->json(new UserResource($user->load('permissions')), 201);
    }

    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($request->has('name')) {
            $user->name = $request->validated('name');
        }

        if ($request->has('role')) {
            $oldRole  = $user->role;
            $newRole  = $request->validated('role');
            $user->role = $newRole;
            $user->syncRoles([$newRole]);
            AuditLog::record('users.role_changed', $user, ['old' => $oldRole, 'new' => $newRole]);
        }

        if ($request->has('permissions')) {
            $oldPerms = $user->permissions->pluck('name')->toArray();
            $newPerms = $request->validated('permissions');
            $user->syncPermissions($newPerms);
            AuditLog::record('users.permissions_changed', $user, ['old' => $oldPerms, 'new' => $newPerms]);
        }

        $user->save();

        return response()->json(new UserResource($user->fresh()->load('permissions')));
    }

    public function activate(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => true]);
        AuditLog::record('users.activated', $user);
        return response()->json(new UserResource($user->load('permissions')));
    }

    public function deactivate(Request $request, int $id): JsonResponse
    {
        if ($request->user()->id === $id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $user = User::findOrFail($id);
        $user->update(['is_active' => false]);
        AuditLog::record('users.deactivated', $user);
        return response()->json(new UserResource($user->load('permissions')));
    }

    public function resendInvite(int $id): JsonResponse
    {
        $user  = User::findOrFail($id);
        $token = Password::createToken($user);
        $url   = config('system.frontend_url') . '/reset-password/' . $token . '?email=' . urlencode($user->email);
        $user->notify(new SystemUserInvitedNotification($url, auth()->user()));
        return response()->json(['message' => 'Invite resent.']);
    }
}
