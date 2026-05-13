<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_message_templates', function (Blueprint $t) {
            $t->id();
            $t->string('key', 80)->unique();
            $t->enum('channel', ['whatsapp', 'email']);
            $t->string('label', 120);
            $t->string('subject', 200)->nullable();
            $t->text('body');
            $t->json('available_variables');
            $t->json('example_values')->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_message_templates');
    }
};
