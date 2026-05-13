<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_sessions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete();
            $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
            $t->foreignId('schedule_pattern_id')->nullable()->constrained('sys_schedule_patterns')->nullOnDelete();
            $t->foreignId('original_session_id')->nullable()->constrained('sys_sessions')->nullOnDelete();
            $t->timestamp('scheduled_start');                  // UTC
            $t->timestamp('scheduled_end');                    // UTC
            $t->unsignedSmallInteger('duration_min');          // denormalized for fast queries
            $t->enum('status', [
                'scheduled',
                'attended',
                'absent',
                'cancelled',
                'rescheduled',
                'pending_substitute',
            ])->default('scheduled');
            $t->enum('cancelled_by', ['student', 'teacher', 'admin', 'system'])->nullable();
            $t->string('cancellation_reason')->nullable();
            $t->string('zoom_meeting_id', 64)->nullable();
            $t->string('zoom_join_url', 500)->nullable();      // sent to student
            $t->string('zoom_start_url', 800)->nullable();     // sent to teacher only
            $t->timestamp('attended_marked_at')->nullable();
            $t->foreignId('attended_marked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('report_overdue_at')->nullable();
            $t->softDeletes();
            $t->timestamps();
            $t->index(['scheduled_start']);
            $t->index(['teacher_id', 'scheduled_start']);
            $t->index(['student_id', 'scheduled_start']);
            $t->index(['status']);
            $t->index(['status', 'scheduled_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_sessions');
    }
};
