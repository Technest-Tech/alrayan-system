<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_wassender_logs', function (Blueprint $t) {
            $t->id();
            $t->string('template_key', 80)->nullable();
            $t->foreignId('whatsapp_group_id')->nullable()->constrained('sys_whatsapp_groups')->nullOnDelete();
            $t->string('recipient_phone', 32)->nullable();
            $t->text('rendered_message');
            $t->enum('status', ['queued', 'sending', 'sent', 'failed', 'dead'])->default('queued');
            $t->string('external_message_id', 120)->nullable()->unique();
            $t->unsignedTinyInteger('attempt_count')->default(0);
            $t->string('error', 500)->nullable();
            $t->json('payload')->nullable();
            $t->timestamp('sent_at')->nullable();
            $t->timestamps();
            $t->index(['template_key', 'sent_at']);
            $t->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_wassender_logs');
    }
};
