<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Support\System\Permissions\PermissionRegistry;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::withCount('users')
            ->with('permissions')
            ->get()
            ->map(fn($role) => [
                'id'          => $role->id,
                'name'        => $role->name,
                'users_count' => $role->users_count,
                'permissions' => $role->permissions->pluck('name')->values()->toArray(),
            ]);

        $groups = collect(PermissionRegistry::GROUPS)
            ->map(fn($actions, $group) => ['group' => $group, 'actions' => $actions])
            ->values();

        return response()->json([
            'data' => [
                'roles'             => $roles,
                'permission_groups' => $groups,
            ],
        ]);
    }
}
