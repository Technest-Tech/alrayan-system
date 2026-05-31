<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_teacher_notes', function (Blueprint $t) {
            $t->enum('note_type', ['general', 'hr', 'performance', 'warning', 'commendation'])
                ->default('general')->after('body');
            $t->boolean('pinned')->default(false)->after('note_type');
        });

        Schema::table('sys_student_notes', function (Blueprint $t) {
            $t->enum('note_type', ['general', 'hr', 'performance', 'warning', 'commendation'])
                ->default('general')->after('body');
            $t->boolean('pinned')->default(false)->after('note_type');
        });
    }

    public function down(): void
    {
        Schema::table('sys_teacher_notes', function (Blueprint $t) {
            $t->dropColumn(['note_type', 'pinned']);
        });
        Schema::table('sys_student_notes', function (Blueprint $t) {
            $t->dropColumn(['note_type', 'pinned']);
        });
    }
};
