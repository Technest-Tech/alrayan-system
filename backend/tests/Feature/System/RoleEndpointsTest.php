<?php

namespace Tests\Feature\System;

use App\Models\User;
use Tests\SystemTestCase;

class RoleEndpointsTest extends SystemTestCase
{
    public function test_admin_can_list_roles_with_member_counts(): void
    {
        // Two extra admins (the acting admin makes three).
        User::factory()->count(2)->create(['role' => 'admin'])->each(fn ($u) => $u->syncRoles(['admin']));

        $response = $this->asAdmin()
            ->getJson('/api/system/roles')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'roles'             => [['id', 'name', 'users_count', 'permissions']],
                    'permission_groups' => [['group', 'actions']],
                ],
            ]);

        $admin = collect($response->json('data.roles'))->firstWhere('name', 'admin');
        $this->assertSame(3, $admin['users_count']);
        $this->assertNotEmpty($admin['permissions']);
    }
}
