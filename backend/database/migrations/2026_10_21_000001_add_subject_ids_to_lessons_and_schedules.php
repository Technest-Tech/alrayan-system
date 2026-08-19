<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A lesson now covers several subjects at once, and its subjects are the academy's
 * courses (Settings → Subjects) rather than the never-populated sys_lesson_subjects
 * list. Stored as a JSON array of course ids, matching how sys_teachers already
 * keeps teachable_course_ids.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('sys_lessons', function (Blueprint $t) {
            $t->json('subject_ids')->nullable()->after('subject_id');
        });

        Schema::table('sys_lesson_schedules', function (Blueprint $t) {
            $t->json('subject_ids')->nullable()->after('subject_id');
        });
    }

    public function down(): void
    {
        Schema::table('sys_lessons', fn(Blueprint $t) => $t->dropColumn('subject_ids'));
        Schema::table('sys_lesson_schedules', fn(Blueprint $t) => $t->dropColumn('subject_ids'));
    }
};
