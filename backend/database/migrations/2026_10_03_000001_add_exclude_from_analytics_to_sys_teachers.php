<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets an admin drop a teacher (e.g. the owner account, a test user, or a
 * non-teaching staff member) out of the Analytics "Teacher Balance & Earnings"
 * totals while still showing their row. Purely a reporting flag — it never
 * affects payroll generation or the money math itself.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_teachers', function (Blueprint $table) {
            $table->boolean('exclude_from_analytics')->default(false)->after('accepts_new_students');
        });
    }

    public function down(): void
    {
        Schema::table('sys_teachers', function (Blueprint $table) {
            $table->dropColumn('exclude_from_analytics');
        });
    }
};
