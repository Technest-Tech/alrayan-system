<?php

namespace Tests\Feature\System;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\SystemTestCase;

class AuthTest extends SystemTestCase
{
    public function test_login_returns_token_for_valid_credentials(): void
    {
        $user = User::factory()->create([
            'role'      => 'admin',
            'is_active' => true,
            'password'  => Hash::make('secret123'),
        ]);

        $response = $this->postJson('/api/system/auth/login', [
            'email'    => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'id', 'name', 'email', 'role'])
            ->assertJsonPath('email', $user->email)
            ->assertJsonPath('role', 'admin');
    }

    public function test_login_fails_for_wrong_password(): void
    {
        $user = User::factory()->create([
            'is_active' => true,
            'password'  => Hash::make('correct'),
        ]);

        $response = $this->postJson('/api/system/auth/login', [
            'email'    => $user->email,
            'password' => 'wrong',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('message', 'Invalid credentials');
    }

    public function test_login_fails_for_inactive_user(): void
    {
        $user = User::factory()->create([
            'is_active' => false,
            'password'  => Hash::make('secret123'),
        ]);

        $response = $this->postJson('/api/system/auth/login', [
            'email'    => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertForbidden()
            ->assertJsonPath('message', 'Account inactive');
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create([
            'role'      => 'admin',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/auth/me');

        $response->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('email', $user->email);
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::factory()->create([
            'role'      => 'admin',
            'is_active' => true,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/system/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Signed out');
    }

    public function test_protected_route_requires_auth(): void
    {
        $this->getJson('/api/system/dashboard')
            ->assertUnauthorized();
    }
}
