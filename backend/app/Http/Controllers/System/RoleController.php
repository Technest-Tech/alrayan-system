<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Support\System\Permissions\PermissionRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        // Count members via the pivot table rather than Role::withCount('users').
        // The latter builds Spatie's polymorphic users() relation, which resolves
        // the model class from the *active* guard — and the `sanctum` guard has a
        // null provider, so it throws "Class name must be a valid object or a
        // string" during an authenticated request.
        $userCounts = DB::table('model_has_roles')
            ->selectRaw('role_id, count(*) as aggregate')
            ->groupBy('role_id')
            ->pluck('aggregate', 'role_id');

        $roles = Role::with('permissions')
            ->get()
            ->map(fn($role) => [
                'id'          => $role->id,
                'name'        => $role->name,
                'users_count' => (int) ($userCounts[$role->id] ?? 0),
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
