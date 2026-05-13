<?php

namespace App\Services\System;

use App\Models\System\SysNotification;
use App\Models\User;
use App\Support\System\Setting;

class NotificationService
{
    public static function push(
        User $user,
        string $type,
        string $title,
        ?string $body = null,
        ?string $link = null,
        ?array $payload = null,
    ): ?SysNotification {
        if (!static::respectsPreferences($user, $type)) return null;
        if (static::isDuplicate($user, $type, $link)) return null;

        return SysNotification::create([
            'user_id' => $user->id,
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
            'link'    => $link,
            'payload' => $payload,
        ]);
    }

    public static function pushToAdmins(
        string $type,
        string $title,
        ?string $body = null,
        ?string $link = null,
    ): void {
        User::role(['admin'])->each(fn($u) => static::push($u, $type, $title, $body, $link));
    }

    public static function pushToAdminsAndSupervisors(
        string $type,
        string $title,
        ?string $body = null,
        ?string $link = null,
        ?string $requiredPerm = null,
    ): void {
        User::role(['admin', 'supervisor'])
            ->when($requiredPerm, fn($q) => $q->permission($requiredPerm))
            ->each(fn($u) => static::push($u, $type, $title, $body, $link));
    }

    private static function isDuplicate(User $user, string $type, ?string $link): bool
    {
        $windowHours = (int) Setting::get('notifications.dedupe.window_hours', 24);
        if ($windowHours <= 0) return false;

        return SysNotification::where('user_id', $user->id)
            ->where('type', $type)
            ->where('link', $link)
            ->where('read_at', null)
            ->where('created_at', '>=', now()->subHours($windowHours))
            ->exists();
    }

    private static function respectsPreferences(User $user, string $type): bool
    {
        $mutedKey = "notifications.prefs.{$user->id}";
        $muted    = json_decode(Setting::get($mutedKey, '[]'), true) ?: [];
        return !in_array($type, $muted, true);
    }
}
