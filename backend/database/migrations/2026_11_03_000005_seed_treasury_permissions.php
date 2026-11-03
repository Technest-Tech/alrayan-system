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

        // Creates treasury.* and expenses.manage_categories, which the routes already
        // used but the registry never listed — so only the admin bypass could reach it.
        foreach (PermissionRegistry::all() as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web'])
            ->syncPermissions(PermissionRegistry::all());

        Role::firstOrCreate(['name' => 'accountant', 'guard_name' => 'web'])
            ->givePermissionTo(DefaultRoles::forRole('accountant'));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionRegistry::GROUPS['treasury'] as $action) {
            Permission::where('name', "treasury.$action")->where('guard_name', 'web')->delete();
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
