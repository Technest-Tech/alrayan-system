<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_students', function (Blueprint $t) {
            // Additive identity link. We deliberately keep sys_students.id as the PK
            // and never touch any FK pointing at it, so billing/scheduling/etc. are untouched.
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
        Schema::table('sys_students', function (Blueprint $t) {
            $t->dropForeign(['user_id']);
            $t->dropUnique(['user_id']);
            $t->dropColumn('user_id');
        });
    }
};
