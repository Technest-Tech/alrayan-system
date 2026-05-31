<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_students', function (Blueprint $t) {
            $t->foreignId('guardian_id')
                ->nullable()
                ->after('timezone')
                ->constrained('sys_guardians')
                ->nullOnDelete();

            $t->enum('student_type', ['child', 'adult'])
                ->default('adult')
                ->after('guardian_id');

            $t->dropColumn([
                'age_category',
                'parent_name',
                'parent_phone',
                'parent_whatsapp',
                'parent_email',
                'phone',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('sys_students', function (Blueprint $t) {
            $t->dropForeign(['guardian_id']);
            $t->dropColumn(['guardian_id', 'student_type']);

            $t->enum('age_category', ['child', 'adult'])->after('timezone');
            $t->string('parent_name')->nullable();
            $t->string('parent_phone', 32)->nullable();
            $t->string('parent_whatsapp', 32)->nullable();
            $t->string('parent_email')->nullable();
            $t->string('phone', 32)->nullable();
        });
    }
};
