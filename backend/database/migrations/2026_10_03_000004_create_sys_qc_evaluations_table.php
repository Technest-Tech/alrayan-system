<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_qc_evaluations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('teacher_id')->nullable()->constrained('sys_teachers')->nullOnDelete();
            $t->foreignId('student_id')->nullable()->constrained('sys_students')->nullOnDelete();
            $t->foreignId('quality_manager_id')->nullable()->constrained('users')->nullOnDelete();

            $t->unsignedSmallInteger('duration_minutes')->default(0);
            $t->decimal('score', 5, 2)->default(100);   // 0.00 – 100.00, computed authoritatively server-side
            $t->text('general_notes')->nullable();
            $t->timestamp('evaluated_at')->nullable();

            $t->softDeletes();
            $t->timestamps();

            $t->index(['teacher_id']);
            $t->index(['quality_manager_id']);
            $t->index(['evaluated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_qc_evaluations');
    }
};
