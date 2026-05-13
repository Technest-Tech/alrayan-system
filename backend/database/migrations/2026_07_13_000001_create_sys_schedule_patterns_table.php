<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_schedule_patterns', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete();
            $t->unsignedTinyInteger('day_of_week');            // 0=Sun … 6=Sat
            $t->time('start_time');                            // local time in $timezone
            $t->unsignedSmallInteger('duration_min');          // 30 / 45 / 60
            $t->string('timezone', 64);                        // student's tz at time of pattern creation
            $t->date('valid_from');                            // inclusive
            $t->date('valid_to')->nullable();                  // inclusive, NULL = open-ended
            $t->foreignId('teacher_id')->nullable()->constrained('sys_teachers')->nullOnDelete();
            $t->softDeletes();
            $t->timestamps();
            $t->index(['student_id', 'valid_from', 'valid_to']);
            $t->index(['teacher_id', 'valid_from', 'valid_to']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_schedule_patterns');
    }
};
