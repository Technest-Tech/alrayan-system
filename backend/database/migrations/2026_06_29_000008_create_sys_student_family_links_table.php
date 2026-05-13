<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_student_family_links', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete();
            $t->foreignId('sibling_student_id')->constrained('sys_students')->cascadeOnDelete();
            $t->unsignedTinyInteger('discount_pct')->default(0);
            $t->timestamps();
            $t->unique(['student_id', 'sibling_student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_student_family_links');
    }
};
