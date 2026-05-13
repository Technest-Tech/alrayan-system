<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_session_reports', function (Blueprint $t) {
            $t->id();
            $t->foreignId('session_id')->unique()->constrained('sys_sessions')->cascadeOnDelete();
            $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
            $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete(); // denormalized
            $t->text('covered_text');
            $t->enum('performance', ['excellent', 'good', 'needs_improvement']);
            $t->text('homework_text')->nullable();
            $t->text('next_session_notes')->nullable();
            $t->timestamp('submitted_at');
            $t->softDeletes();
            $t->timestamps();
            $t->index(['teacher_id', 'submitted_at']);
            $t->index(['student_id', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_session_reports');
    }
};
