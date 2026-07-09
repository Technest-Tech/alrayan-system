<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Deleting a teacher must remove the teacher and nothing else.
 *
 * These five tables held teacher_id NOT NULL, so a lesson/session/report/schedule/payroll could
 * not outlive its teacher: sys_lessons and sys_payrolls were restrictOnDelete (the delete simply
 * failed) while the other three were cascadeOnDelete (the rows were silently destroyed).
 *
 * Make the column nullable and the FK nullOnDelete, so the record survives and only loses its
 * link. The teacher's own rows — quality reviews, availability, notes, leaves — keep cascading.
 */
return new class extends Migration
{
    /** table => the delete rule it had before, for down(). */
    private const TABLES = [
        'sys_lessons'          => 'restrict',
        'sys_payrolls'         => 'restrict',
        'sys_sessions'         => 'cascade',
        'sys_session_reports'  => 'cascade',
        'sys_lesson_schedules' => 'cascade',
    ];

    public function up(): void
    {
        foreach (array_keys(self::TABLES) as $table) {
            Schema::table($table, fn (Blueprint $t) => $t->dropForeign(['teacher_id']));
            Schema::table($table, fn (Blueprint $t) => $t->unsignedBigInteger('teacher_id')->nullable()->change());
            Schema::table($table, fn (Blueprint $t) => $t->foreign('teacher_id')
                ->references('id')->on('sys_teachers')->nullOnDelete());
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table => $rule) {
            Schema::table($table, fn (Blueprint $t) => $t->dropForeign(['teacher_id']));
            Schema::table($table, fn (Blueprint $t) => $t->unsignedBigInteger('teacher_id')->nullable(false)->change());
            Schema::table($table, function (Blueprint $t) use ($rule) {
                $fk = $t->foreign('teacher_id')->references('id')->on('sys_teachers');
                $rule === 'restrict' ? $fk->restrictOnDelete() : $fk->cascadeOnDelete();
            });
        }
    }
};
