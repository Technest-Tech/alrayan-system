<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_task_notes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('task_id')->constrained('sys_tasks')->cascadeOnDelete();
            $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->text('body');
            $t->timestamps();

            $t->index(['task_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_task_notes');
    }
};
