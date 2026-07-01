<?php

use App\Support\System\Permissions\DefaultRoles;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Teachers were seeded with no permissions, so they could not reach their own
 * portal (calendar/lessons 403'd). Grant the teacher default permission set
 * (lessons.view/create/edit/delete) that unlocks the shared, server-scoped
 * calendar and lets them manage their own lessons. Additive — safe to re-run.
 */
return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (DefaultRoles::TEACHER_DEFAULTS as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web'])
            ->givePermissionTo(DefaultRoles::TEACHER_DEFAULTS);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $teacher = Role::where('name', 'teacher')->where('guard_name', 'web')->first();
        if ($teacher) {
            foreach (DefaultRoles::TEACHER_DEFAULTS as $perm) {
                $teacher->revokePermissionTo($perm);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
