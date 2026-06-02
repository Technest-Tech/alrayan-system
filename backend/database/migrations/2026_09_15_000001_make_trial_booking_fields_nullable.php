<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite (used in tests) can't ALTER columns — recreate when needed.
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('trial_bookings', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->string('country', 100)->nullable()->change();
            $table->string('course_interest', 100)->nullable()->change();
            $table->string('preferred_time', 50)->nullable()->change();
            $table->string('timezone', 100)->nullable()->change();
        });

        // age_group is an enum — relax to nullable via raw SQL for MySQL/MariaDB.
        $driver = DB::getDriverName();
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE trial_bookings MODIFY age_group ENUM('kid-5-8','kid-9-12','teen','adult') NULL");
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE trial_bookings ALTER COLUMN age_group DROP NOT NULL');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('trial_bookings', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
            $table->string('country', 100)->nullable(false)->change();
            $table->string('course_interest', 100)->nullable(false)->change();
            $table->string('preferred_time', 50)->nullable(false)->change();
            $table->string('timezone', 100)->nullable(false)->change();
        });

        $driver = DB::getDriverName();
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE trial_bookings MODIFY age_group ENUM('kid-5-8','kid-9-12','teen','adult') NOT NULL");
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE trial_bookings ALTER COLUMN age_group SET NOT NULL');
        }
    }
};
