<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_whatsapp_groups', function (Blueprint $t) {
            $t->id();
            $t->enum('type', ['student', 'teacher']);
            $t->string('invite_link', 500);
            $t->enum('status', ['active', 'stopped'])->default('active');
            $t->string('external_group_id', 100)->nullable();
            $t->foreignId('linked_student_id')->nullable()->constrained('sys_students')->nullOnDelete();
            $t->foreignId('linked_teacher_id')->nullable()->constrained('sys_teachers')->nullOnDelete();
            $t->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->softDeletes();
            $t->timestamps();
            $t->index(['status', 'type']);
            $t->index(['linked_student_id']);
            $t->index(['linked_teacher_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_whatsapp_groups');
    }
};
