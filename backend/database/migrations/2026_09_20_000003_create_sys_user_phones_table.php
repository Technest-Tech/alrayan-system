<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_user_phones', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->string('phone', 32);
            $t->enum('type', ['phone', 'whatsapp'])->default('phone');
            $t->string('label')->nullable();
            $t->boolean('is_primary')->default(false);
            $t->timestamps();

            $t->unique(['user_id', 'phone', 'type']);
            $t->index('phone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_user_phones');
    }
};
