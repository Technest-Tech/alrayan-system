<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_student_packages', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('paid_at');
        });

        $driver = DB::getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE sys_student_packages MODIFY COLUMN status ENUM('pending','paid','suspended') NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE sys_student_packages MODIFY COLUMN status ENUM('pending','paid') NOT NULL DEFAULT 'pending'");
        }

        Schema::table('sys_student_packages', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
