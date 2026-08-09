<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A package an admin created or edited by hand must never be auto-deleted by the
 * rebuild engine. Without this flag a pending package that happens to hold no lessons
 * (because the ones before it still have room) is soft-deleted the moment its hours
 * are edited — the API returns 200 and the row silently vanishes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_student_packages', function (Blueprint $table) {
            $table->boolean('is_manual')->default(false)->after('needs_reconfirmation');
        });
    }

    public function down(): void
    {
        Schema::table('sys_student_packages', function (Blueprint $table) {
            $table->dropColumn('is_manual');
        });
    }
};
