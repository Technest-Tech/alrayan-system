<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sys_lesson_schedule_slots', function (Blueprint $t) {
            $t->id();
            $t->foreignId('schedule_id')->constrained('sys_lesson_schedules')->cascadeOnDelete();
            $t->unsignedTinyInteger('day_of_week'); // 0=Sun … 6=Sat
            $t->time('start_time');
            $t->unsignedSmallInteger('duration_minutes')->default(60);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_lesson_schedule_slots');
    }
};
