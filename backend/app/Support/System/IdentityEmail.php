<?php

namespace App\Support\System;

use App\Models\User;
use Illuminate\Support\Str;

/**
 * Generates unique, synthesized email addresses for people who do not have a
 * real one (students, guardians). Identity now lives on the `users` table, so
 * uniqueness is checked there.
 */
class IdentityEmail
{
    public static function unique(string $name, string $domain): string
    {
        $slug    = Str::slug($name, '.') ?: 'user';
        $email   = "{$slug}@{$domain}";
        $counter = 2;

        while (User::where('email', $email)->exists()) {
            $email = "{$slug}.{$counter}@{$domain}";
            $counter++;
        }

        return $email;
    }

    public static function forStudent(string $name): string
    {
        return self::unique($name, config('app.student_email_domain', 'students.alrayanquran.com'));
    }

    public static function forGuardian(string $name): string
    {
        return self::unique($name, config('app.guardian_email_domain', 'guardians.alrayanquran.com'));
    }
}
