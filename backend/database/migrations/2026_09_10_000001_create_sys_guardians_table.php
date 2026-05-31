<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_guardians', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('whatsapp', 32);
            $t->timestamps();
            $t->index('whatsapp');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_guardians');
    }
};
