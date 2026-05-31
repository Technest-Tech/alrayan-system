<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sys_lesson_subjects', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->json('fields')->nullable();
            $t->unsignedSmallInteger('sort_order')->default(0);
            $t->softDeletes();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_lesson_subjects');
    }
};
