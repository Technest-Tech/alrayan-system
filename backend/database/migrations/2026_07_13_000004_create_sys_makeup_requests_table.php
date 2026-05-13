<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_makeup_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('original_session_id')->constrained('sys_sessions')->cascadeOnDelete();
            $t->foreignId('requested_by_user_id')->constrained('users')->cascadeOnDelete();
            $t->timestamp('proposed_start_at');                // UTC
            $t->unsignedSmallInteger('proposed_duration_min');
            $t->text('reason')->nullable();
            $t->enum('status', ['pending', 'approved', 'denied'])->default('pending');
            $t->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->text('review_note')->nullable();
            $t->timestamp('reviewed_at')->nullable();
            $t->foreignId('makeup_session_id')->nullable()->constrained('sys_sessions')->nullOnDelete();
            $t->timestamps();
            $t->index(['status', 'created_at']);
            $t->index(['original_session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_makeup_requests');
    }
};
