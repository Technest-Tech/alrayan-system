<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_tasks', function (Blueprint $t) {
            $t->id();

            // Polymorphic type/status/priority kept as strings (validated in the app)
            // so new task types can be added without an enum-altering migration.
            $t->string('type', 40);                      // package_complete, schedule_removal, ...
            $t->string('status', 24)->default('new');    // new, following_up, review_underway, done, postponed
            $t->string('priority', 12)->default('medium');// low, medium, high, urgent

            $t->string('title');
            $t->text('body')->nullable();
            $t->json('payload')->nullable();             // per-type context (hours, sessions, amount, notes, ...)

            // The domain record this task was generated from (StudentPackage|Session|Lesson|Student).
            $t->string('related_type')->nullable();
            $t->unsignedBigInteger('related_id')->nullable();

            // Denormalized references for filtering / display.
            $t->foreignId('student_id')->nullable()->constrained('sys_students')->nullOnDelete();
            $t->foreignId('teacher_id')->nullable()->constrained('sys_teachers')->nullOnDelete();

            // Assignment is by role, with optional individual assignment.
            $t->string('assignee_role', 32)->nullable();
            $t->foreignId('assignee_user_id')->nullable()->constrained('users')->nullOnDelete();

            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete(); // null = system-generated
            $t->timestamp('due_at')->nullable();

            // Approve / reject decision on actionable tasks.
            $t->string('decision', 12)->nullable();      // approved | rejected
            $t->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('decided_at')->nullable();
            $t->text('decision_notes')->nullable();

            $t->softDeletes();
            $t->timestamps();

            $t->index(['status']);
            $t->index(['type']);
            $t->index(['priority']);
            $t->index(['assignee_role', 'status']);
            $t->index(['student_id']);
            $t->index(['teacher_id']);
            $t->index(['type', 'related_type', 'related_id']); // generator dedup lookup
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_tasks');
    }
};
