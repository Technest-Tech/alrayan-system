<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_audit_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('action');
            $t->string('target_type')->nullable();
            $t->unsignedBigInteger('target_id')->nullable();
            $t->json('payload')->nullable();
            $t->ipAddress('ip')->nullable();
            $t->string('user_agent', 512)->nullable();
            $t->timestamps();
            $t->index(['actor_user_id', 'created_at']);
            $t->index(['target_type', 'target_id', 'created_at']);
            $t->index(['action', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_audit_logs');
    }
};
