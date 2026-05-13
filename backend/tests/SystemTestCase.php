<?php

namespace Tests;

use App\Models\System\Teacher;
use App\Models\User;
use App\Support\System\Permissions\PermissionRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

abstract class SystemTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();
    }

    private function seedRolesAndPermissions(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (PermissionRegistry::all() as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(PermissionRegistry::all());

        Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'supervisor', 'guard_name' => 'web']);
    }

    protected function adminUser(): User
    {
        $user = User::factory()->create([
            'role'      => 'admin',
            'is_active' => true,
        ]);

        $user->syncRoles(['admin']);

        return $user;
    }

    protected function teacherUser(): array
    {
        $teacher = Teacher::factory()->create();

        $teacher->user->update(['role' => 'teacher', 'is_active' => true]);
        $teacher->user->syncRoles(['teacher']);

        return ['user' => $teacher->user->fresh(), 'teacher' => $teacher];
    }

    protected function asAdmin(): static
    {
        $this->actingAs($this->adminUser(), 'sanctum');

        return $this;
    }

    protected function asTeacher(?Teacher $teacher = null): static
    {
        if ($teacher === null) {
            ['teacher' => $teacher] = $this->teacherUser();
        }

        $this->actingAs($teacher->user, 'sanctum');

        return $this;
    }
}
