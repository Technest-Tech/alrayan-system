<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A lead now provisions a real student (+ user) the moment it is created, before any
     * payment details exist. `student_id` links that provisional student; it is distinct
     * from `converted_to_student_id`, which stays meaning "finalised / closed conversion".
     * Also relaxes sys_students.country to nullable — a freshly-provisioned student may not
     * have a country captured yet.
     */
    public function up(): void
    {
        Schema::table('sys_leads', function (Blueprint $table) {
            if (! Schema::hasColumn('sys_leads', 'student_id')) {
                $table->foreignId('student_id')
                    ->nullable()
                    ->after('converted_to_student_id')
                    ->constrained('sys_students')
                    ->nullOnDelete();
            }
        });

        Schema::table('sys_students', function (Blueprint $table) {
            $table->string('country', 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('sys_leads', function (Blueprint $table) {
            if (Schema::hasColumn('sys_leads', 'student_id')) {
                $table->dropConstrainedForeignId('student_id');
            }
        });
    }
};
