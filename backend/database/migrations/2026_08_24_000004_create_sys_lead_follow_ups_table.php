<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_lead_follow_ups', function (Blueprint $t) {
            $t->id();
            $t->foreignId('lead_id')->constrained('sys_leads')->cascadeOnDelete();
            $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('due_at');
            $t->string('action', 200);
            $t->text('notes')->nullable();
            $t->timestamp('completed_at')->nullable();
            $t->text('completion_notes')->nullable();
            $t->timestamps();
            $t->index(['lead_id', 'due_at']);
            $t->index(['due_at', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_lead_follow_ups');
    }
};
