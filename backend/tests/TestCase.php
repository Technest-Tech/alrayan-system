<?php

namespace Tests;

use Database\Seeders\System\RolePermissionSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Safety net: RefreshDatabase truncates/migrates the *default* connection.
        // If a cached config (bootstrap/cache/config.php) or a stray env leaves the
        // default connection pointed at a real DB (e.g. the mysql dev DB), the suite
        // would silently wipe it. Fail loudly instead of destroying real data.
        $conn = DB::connection();
        $isMemorySqlite = $conn->getDriverName() === 'sqlite' && $conn->getDatabaseName() === ':memory:';
        if (! $isMemorySqlite) {
            throw new \RuntimeException(
                "Refusing to run tests against connection '{$conn->getName()}' "
                . "({$conn->getDriverName()}:{$conn->getDatabaseName()}). Tests must use the "
                . 'in-memory sqlite DB. Run `php artisan config:clear` — a cached config is '
                . 'overriding phpunit.xml.'
            );
        }

        if (in_array(\Illuminate\Foundation\Testing\RefreshDatabase::class, class_uses_recursive(static::class))) {
            $this->seed(RolePermissionSeeder::class);
        }
    }
}
