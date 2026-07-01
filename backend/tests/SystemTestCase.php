<?php

namespace Tests;

use App\Models\System\Teacher;
use App\Models\User;
use App\Support\System\Permissions\DefaultRoles;
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

        foreach (['supervisor', 'quality', 'accountant', 'teacher'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web'])
                ->givePermissionTo(DefaultRoles::forRole($role));
        }

        foreach (['parent', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    /**
     * Create a staff user with the given role and its default permissions.
     */
    protected function staffUser(string $role): User
    {
        $user = User::factory()->create([
            'role'      => $role,
            'is_active' => true,
            'status'    => 'active',
        ]);

        $user->syncRoles([$role]);

        return $user;
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
