<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_arabic');
            $table->string('role');
            $table->text('bio');
            $table->string('image')->nullable();
            $table->json('specialties');
            $table->json('languages');
            $table->string('credentials');
            $table->boolean('is_female')->default(false);
            $table->unsignedSmallInteger('years_experience')->default(0);
            $table->unsignedSmallInteger('students_count')->default(0);
            $table->boolean('featured')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
