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

        // Ensure every permission (including the new users.* actions) exists.
        foreach (PermissionRegistry::all() as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // Admin keeps every permission.
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(PermissionRegistry::all());

        // Operator roles get their default permission sets (without revoking
        // anything already granted manually).
        foreach (['supervisor', 'quality', 'accountant'] as $role) {
            $model = Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
            $model->givePermissionTo(DefaultRoles::forRole($role));
        }

        // Subject roles exist for filtering/assignment but carry no panel perms.
        foreach (['teacher', 'parent', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        foreach (['quality', 'accountant', 'parent', 'student'] as $role) {
            Role::where('name', $role)->where('guard_name', 'web')->delete();
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
