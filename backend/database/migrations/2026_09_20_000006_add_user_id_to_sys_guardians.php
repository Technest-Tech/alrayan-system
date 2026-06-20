<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_guardians', function (Blueprint $t) {
            // Additive identity link. sys_guardians.id stays the PK so
            // sys_students.guardian_id keeps working unchanged.
            $t->foreignId('user_id')
                ->nullable()
                ->unique()
                ->after('id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sys_guardians', function (Blueprint $t) {
            $t->dropForeign(['user_id']);
            $t->dropUnique(['user_id']);
            $t->dropColumn('user_id');
        });
    }
};
