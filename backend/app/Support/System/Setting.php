<?php

namespace App\Support\System;

use Illuminate\Support\Facades\DB;

class Setting
{
    public static function get(string $key, mixed $default = null): mixed
    {
        $row = DB::table('sys_settings')->where('key', $key)->first();
        if (!$row) return $default;
        return $row->value;
    }

    public static function set(string $key, mixed $value): void
    {
        DB::table('sys_settings')->upsert(
            [['key' => $key, 'value' => is_array($value) ? json_encode($value) : (string) $value, 'created_at' => now(), 'updated_at' => now()]],
            ['key'],
            ['value', 'updated_at']
        );
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $v = static::get($key, $default ? '1' : '0');
        return in_array($v, ['1', 'true', true, 1], true);
    }

    public static function int(string $key, int $default = 0): int
    {
        return (int) static::get($key, $default);
    }

    public static function raw(string $key): mixed
    {
        return DB::table('sys_settings')->where('key', $key)->value('value');
    }

    public static function setMany(array $data): void
    {
        foreach ($data as $key => $value) {
            static::set($key, $value);
        }
    }

    public static function all(): array
    {
        return DB::table('sys_settings')->pluck('value', 'key')->toArray();
    }
}
