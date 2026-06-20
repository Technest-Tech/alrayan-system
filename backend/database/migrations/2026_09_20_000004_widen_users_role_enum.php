<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const ROLES = ['admin', 'supervisor', 'quality', 'teacher', 'accountant', 'parent', 'student'];

    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            // MySQL keeps a real ENUM; widen it to the full role set.
            $values = "'" . implode("','", self::ROLES) . "'";
            DB::statement("ALTER TABLE users MODIFY role ENUM($values) NULL");

            return;
        }

        // SQLite (and others) store enums as a CHECK-constrained varchar. Rebuild
        // the column as a plain string so all unified roles are accepted; the
        // application validates the role at the request layer.
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 32)->nullable()->change();
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin','supervisor','teacher') NULL");

            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 32)->nullable()->change();
        });
    }
};
