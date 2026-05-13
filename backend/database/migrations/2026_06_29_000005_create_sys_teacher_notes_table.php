<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_teacher_notes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
            $t->foreignId('author_user_id')->constrained('users')->restrictOnDelete();
            $t->text('body');
            $t->softDeletes();
            $t->timestamps();
            $t->index(['teacher_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_teacher_notes');
    }
};
