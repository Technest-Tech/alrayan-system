<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sys_lesson_schedules', function (Blueprint $t) {
            $t->id();
            $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
            $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete();
            $t->foreignId('subject_id')->nullable()->constrained('sys_lesson_subjects')->nullOnDelete();
            $t->enum('recurrence', ['none', 'weekly', 'biweekly', 'every_4_weeks', 'custom'])->default('none');
            $t->date('start_date');
            $t->boolean('is_active')->default(true);
            $t->softDeletes();
            $t->timestamps();

            $t->index(['teacher_id', 'student_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_lesson_schedules');
    }
};
