<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_invoice_counters', function (Blueprint $t) {
            $t->id();
            $t->unsignedSmallInteger('year')->unique();
            $t->unsignedInteger('last')->default(0);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_invoice_counters');
    }
};
