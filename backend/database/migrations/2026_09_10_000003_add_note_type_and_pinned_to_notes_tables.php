<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = function (Blueprint $t) {
            $t->enum('note_type', ['general', 'hr', 'performance', 'warning', 'commendation'])
              ->default('general')
              ->after('body');
            $t->boolean('pinned')->default(false)->after('note_type');
        };

        Schema::table('sys_teacher_notes', $columns);
        Schema::table('sys_student_notes', $columns);
    }

    public function down(): void
    {
        foreach (['sys_teacher_notes', 'sys_student_notes'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn(['note_type', 'pinned']);
            });
        }
    }
};
