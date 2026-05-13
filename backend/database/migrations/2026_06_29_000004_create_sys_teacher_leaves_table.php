<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_teacher_leaves', function (Blueprint $t) {
            $t->id();
            $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
            $t->date('start_date');
            $t->date('end_date');
            $t->string('reason', 500);
            $t->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $t->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->text('review_note')->nullable();
            $t->timestamp('reviewed_at')->nullable();
            $t->timestamps();
            $t->index(['teacher_id', 'status']);
            $t->index(['start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_teacher_leaves');
    }
};
