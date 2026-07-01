<?php

namespace Database\Seeders\System;

use App\Support\System\Permissions\DefaultRoles;
use App\Support\System\Permissions\PermissionRegistry;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (PermissionRegistry::all() as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(PermissionRegistry::all());

        Role::firstOrCreate(['name' => 'supervisor', 'guard_name' => 'web'])
            ->syncPermissions(DefaultRoles::SUPERVISOR_DEFAULTS);

        Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web'])
            ->syncPermissions(DefaultRoles::TEACHER_DEFAULTS);
    }
}
