<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_whatsapp_send_logs', function (Blueprint $t) {
            $t->id();
            $t->string('recipient_phone', 32);

            // TEXT | IMAGE | REPORT — a classification for filtering. The wire
            // format is chosen from image_url, not from this.
            $t->string('kind', 12)->default('TEXT');

            $t->text('body')->nullable();
            $t->string('image_url', 2048)->nullable();
            $t->string('caption', 1024)->nullable();

            // Replayed on resend so a send that succeeded upstream but failed to
            // record locally comes back as DUPLICATE instead of sending twice.
            $t->string('idempotency_key', 64)->unique();

            // QUEUED | ACCEPTED | DUPLICATE | FAILED. Plain string, not enum:
            // enum() emits a CHECK constraint on SQLite that the test schema
            // then diverges on the first time a value is added.
            $t->string('status', 12)->default('QUEUED');

            $t->string('provider_message_id', 120)->nullable();
            $t->unsignedSmallInteger('http_status')->nullable();
            $t->string('error', 1000)->nullable();
            $t->unsignedTinyInteger('attempt_count')->default(0);

            $t->timestamps();

            $t->index(['status', 'created_at']);
            $t->index(['kind', 'created_at']);
            $t->index('recipient_phone');
            $t->index('provider_message_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_whatsapp_send_logs');
    }
};
