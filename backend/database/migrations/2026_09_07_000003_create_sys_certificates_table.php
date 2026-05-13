<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_certificates', function (Blueprint $t) {
            $t->id();
            $t->string('certificate_number', 32)->unique();
            $t->foreignId('student_id')->constrained('sys_students')->restrictOnDelete();
            $t->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $t->foreignId('teacher_id')->nullable()->constrained('sys_teachers')->nullOnDelete();
            $t->enum('type', ['course_completion', 'hifz_milestone', 'ijazah', 'other']);
            $t->string('title');
            $t->text('description')->nullable();
            $t->date('issued_on');
            $t->string('pdf_path', 500)->nullable();
            $t->timestamp('revoked_at')->nullable();
            $t->foreignId('issued_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->softDeletes();
            $t->timestamps();
            $t->index(['student_id', 'issued_on']);
            $t->index(['type', 'issued_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_certificates');
    }
};
