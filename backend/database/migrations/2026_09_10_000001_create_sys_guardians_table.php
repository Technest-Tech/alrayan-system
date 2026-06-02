<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_guardians', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('whatsapp', 64)->nullable();
            $table->timestamps();

            $table->index('whatsapp');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_guardians');
    }
};
