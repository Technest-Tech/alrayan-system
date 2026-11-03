<?php

namespace App\Support\System;

use App\Models\System\TreasuryAccount;

/**
 * Which account receives student payments and pays teacher salaries, per currency. An account
 * holds one currency and amounts are never converted, so a single account can't serve both a
 * USD and an EGP student. A currency with no account here simply isn't posted.
 */
class TreasuryRouting
{
    public const STUDENTS = 'students';
    public const TEACHERS = 'teachers';

    private const KEY = 'treasury.routing';

    /** @return array{students:array<string,int>,teachers:array<string,int>} */
    public static function all(): array
    {
        $stored = json_decode((string) Setting::get(self::KEY, '{}'), true);

        return [
            self::STUDENTS => $stored[self::STUDENTS] ?? [],
            self::TEACHERS => $stored[self::TEACHERS] ?? [],
        ];
    }

    /** @param array{students:array<string,int>,teachers:array<string,int>} $routing */
    public static function save(array $routing): void
    {
        Setting::set(self::KEY, json_encode($routing));
    }

    /** The account to post to, or null when none is set or it has since been archived. */
    public static function accountFor(string $audience, string $currency): ?TreasuryAccount
    {
        $id = self::all()[$audience][$currency] ?? null;

        return $id
            ? TreasuryAccount::active()->where('currency', $currency)->find($id)
            : null;
    }
}
