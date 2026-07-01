<?php

namespace App\Services\System;

use App\Models\System\UserEmail;
use App\Models\System\UserPhone;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Creates and updates the shared `users` identity row (and its email/phone
 * child rows + role/permissions) for any kind of person in the system.
 */
class UserProvisioner
{
    private const SHARED_FIELDS = ['name', 'phone', 'whatsapp', 'status', 'language', 'birthday', 'gender', 'photo_url', 'notes', 'documents', 'relatives'];

    /**
     * Provision a brand-new user with a role, primary contacts and permissions.
     *
     * @param  array<string,mixed>  $data
     */
    public function create(array $data, string $role): User
    {
        $emails = $this->normalizeContacts($data['emails'] ?? [], 'email');
        $phones = $this->normalizeContacts($data['phones'] ?? [], 'phone');

        $primaryEmail = $this->primaryValue($emails, 'email') ?? ($data['email'] ?? null);
        $primaryPhone = $this->primaryValue($phones, 'phone') ?? ($data['whatsapp'] ?? null);

        $user = User::create(array_merge(
            $this->only($data, self::SHARED_FIELDS),
            [
                'email'     => $primaryEmail,
                'whatsapp'  => $data['whatsapp'] ?? $primaryPhone,
                'role'      => $role,
                'status'    => $data['status'] ?? 'active',
                'is_active' => ($data['status'] ?? 'active') === 'active',
                'password'  => isset($data['password']) ? $data['password'] : Hash::make(Str::random(40)),
            ],
        ));

        $user->syncRoles([$role]);

        if (! empty($data['permissions'])) {
            $user->syncPermissions($data['permissions']);
        }

        $this->syncEmails($user, $emails, $primaryEmail);
        $this->syncPhones($user, $phones, $primaryPhone);

        return $user;
    }

    /**
     * Update shared identity fields, contacts and (optionally) permissions.
     *
     * @param  array<string,mixed>  $data
     */
    public function update(User $user, array $data): User
    {
        $user->fill($this->only($data, self::SHARED_FIELDS));

        if (array_key_exists('emails', $data)) {
            $emails       = $this->normalizeContacts($data['emails'], 'email');
            $primaryEmail = $this->primaryValue($emails, 'email');
            if ($primaryEmail) {
                $user->email = $primaryEmail;
            }
            $this->syncEmails($user->fresh() ?? $user, $emails, $primaryEmail, replace: true);
        }

        if (array_key_exists('phones', $data)) {
            $phones       = $this->normalizeContacts($data['phones'], 'phone');
            $primaryPhone = $this->primaryValue($phones, 'phone');
            $user->whatsapp = $primaryPhone;
            $this->syncPhones($user, $phones, $primaryPhone, replace: true);
        }

        $user->save();

        if (array_key_exists('permissions', $data)) {
            $user->syncPermissions($data['permissions'] ?? []);
        }

        return $user;
    }

    /**
     * @param  array<int,array<string,mixed>>  $emails
     */
    private function syncEmails(User $user, array $emails, ?string $primary, bool $replace = false): void
    {
        if ($replace) {
            $user->emails()->delete();
        }

        if ($primary && ! collect($emails)->contains(fn ($e) => $e['email'] === $primary)) {
            $emails[] = ['email' => $primary, 'is_primary' => true];
        }

        foreach ($emails as $email) {
            UserEmail::updateOrCreate(
                ['user_id' => $user->id, 'email' => $email['email']],
                [
                    'label'      => $email['label'] ?? null,
                    'is_primary' => ($email['email'] === $primary) || ! empty($email['is_primary']),
                ],
            );
        }
    }

    /**
     * @param  array<int,array<string,mixed>>  $phones
     */
    private function syncPhones(User $user, array $phones, ?string $primary, bool $replace = false): void
    {
        if ($replace) {
            $user->phones()->delete();
        }

        if ($primary && ! collect($phones)->contains(fn ($p) => $p['phone'] === $primary)) {
            $phones[] = ['phone' => $primary, 'type' => 'whatsapp', 'is_primary' => true];
        }

        foreach ($phones as $phone) {
            UserPhone::updateOrCreate(
                ['user_id' => $user->id, 'phone' => $phone['phone'], 'type' => $phone['type'] ?? 'phone'],
                [
                    'label'      => $phone['label'] ?? null,
                    'is_primary' => ($phone['phone'] === $primary) || ! empty($phone['is_primary']),
                ],
            );
        }
    }

    /**
     * Accepts either a list of strings or a list of {email|phone, label, is_primary}.
     *
     * @return array<int,array<string,mixed>>
     */
    private function normalizeContacts(array $items, string $key): array
    {
        return collect($items)
            ->map(fn ($item) => is_array($item) ? $item : [$key => $item])
            ->filter(fn ($item) => ! empty($item[$key]))
            ->values()
            ->all();
    }

    private function primaryValue(array $items, string $key): ?string
    {
        if (empty($items)) {
            return null;
        }

        $primary = collect($items)->firstWhere('is_primary', true);

        return ($primary[$key] ?? null) ?: ($items[0][$key] ?? null);
    }

    private function only(array $data, array $keys): array
    {
        return array_intersect_key($data, array_flip($keys));
    }
}
