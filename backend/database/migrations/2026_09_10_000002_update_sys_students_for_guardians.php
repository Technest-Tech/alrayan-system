<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_students', function (Blueprint $table) {
            $table->string('student_type', 10)->default('adult')->after('timezone');
            $table->foreignId('guardian_id')->nullable()->constrained('sys_guardians')->nullOnDelete()->after('student_type');

            $table->dropColumn(['age_category', 'parent_name', 'parent_phone', 'parent_whatsapp', 'parent_email', 'phone']);
        });
    }

    public function down(): void
    {
        Schema::table('sys_students', function (Blueprint $table) {
            $table->dropForeign(['guardian_id']);
            $table->dropColumn(['student_type', 'guardian_id']);

            $table->string('age_category', 10)->nullable()->after('timezone');
            $table->string('parent_name', 255)->nullable();
            $table->string('parent_phone', 32)->nullable();
            $table->string('parent_whatsapp', 32)->nullable();
            $table->string('parent_email', 255)->nullable();
            $table->string('phone', 32)->nullable();
        });
    }
};
