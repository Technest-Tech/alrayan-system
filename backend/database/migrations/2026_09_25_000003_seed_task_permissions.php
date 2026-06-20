<?php

use App\Support\System\Permissions\DefaultRoles;
use App\Support\System\Permissions\PermissionRegistry;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Ensure every permission (including the new tasks.* / task_notes.* actions) exists.
        foreach (PermissionRegistry::all() as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // Admin keeps every permission.
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(PermissionRegistry::all());

        // Operator roles pick up their newly-added task permissions (additive).
        foreach (['supervisor', 'quality', 'accountant'] as $role) {
            $model = Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
            $model->givePermissionTo(DefaultRoles::forRole($role));
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionRegistry::GROUPS['tasks'] as $action) {
            Permission::where('name', "tasks.$action")->where('guard_name', 'web')->delete();
        }
        foreach (PermissionRegistry::GROUPS['task_notes'] as $action) {
            Permission::where('name', "task_notes.$action")->where('guard_name', 'web')->delete();
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
