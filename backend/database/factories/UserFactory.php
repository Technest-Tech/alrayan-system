<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'status' => 'active',
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function status(string $status): static
    {
        return $this->state([
            'status'    => $status,
            'is_active' => $status === 'active',
        ]);
    }

    public function staff(string $role = 'supervisor'): static
    {
        return $this->withRole($role);
    }

    public function student(): static
    {
        return $this->withRole('student');
    }

    public function teacher(): static
    {
        return $this->withRole('teacher');
    }

    public function parent(): static
    {
        return $this->withRole('parent');
    }

    /**
     * Set the role column and sync the matching Spatie role (if it exists).
     */
    public function withRole(string $role): static
    {
        return $this->state(['role' => $role])->afterCreating(function (\App\Models\User $user) use ($role) {
            if (\Spatie\Permission\Models\Role::where('name', $role)->where('guard_name', 'web')->exists()) {
                $user->syncRoles([$role]);
            }
        });
    }
}
