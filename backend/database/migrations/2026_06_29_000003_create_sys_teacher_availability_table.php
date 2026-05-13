<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_teacher_availability', function (Blueprint $t) {
            $t->id();
            $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
            $t->unsignedTinyInteger('day_of_week'); // 0=Sun, 6=Sat
            $t->time('start_time');
            $t->time('end_time');
            $t->string('timezone', 64)->default('Africa/Cairo');
            $t->timestamps();
            $t->index(['teacher_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_teacher_availability');
    }
};
