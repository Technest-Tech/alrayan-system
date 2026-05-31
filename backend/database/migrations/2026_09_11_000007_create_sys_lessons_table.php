<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sys_lessons', function (Blueprint $t) {
            $t->id();
            $t->foreignId('package_id')->constrained('sys_student_packages')->restrictOnDelete();
            $t->foreignId('schedule_id')->nullable()->constrained('sys_lesson_schedules')->nullOnDelete();
            $t->foreignId('teacher_id')->constrained('sys_teachers')->restrictOnDelete();
            $t->foreignId('student_id')->constrained('sys_students')->restrictOnDelete();
            $t->foreignId('subject_id')->nullable()->constrained('sys_lesson_subjects')->nullOnDelete();
            $t->foreignId('evaluation_id')->nullable()->constrained('sys_lesson_evaluations')->nullOnDelete();
            $t->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $t->dateTime('scheduled_at');
            $t->unsignedSmallInteger('duration_minutes')->default(60);
            $t->enum('status', ['scheduled', 'attended', 'paid_absence', 'absent', 'cancelled'])->default('scheduled');
            $t->decimal('session_number_hours', 8, 1)->default(0); // cumulative hours in package at this lesson
            $t->text('content')->nullable();
            $t->text('notes')->nullable();
            $t->text('homework')->nullable();
            $t->string('souvenir_image')->nullable();
            $t->json('subject_details')->nullable();
            $t->softDeletes();
            $t->timestamps();

            $t->index(['student_id', 'package_id']);
            $t->index(['teacher_id', 'scheduled_at']);
            $t->index(['student_id', 'scheduled_at']);
            $t->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_lessons');
    }
};
