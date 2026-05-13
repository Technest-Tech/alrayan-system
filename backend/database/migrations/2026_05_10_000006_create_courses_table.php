<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('short_description');
            $table->text('long_description');
            $table->string('icon');
            $table->string('age_group')->nullable();
            $table->enum('level', ['Beginner', 'Intermediate', 'Advanced', 'All Levels']);
            $table->string('duration_months')->nullable();
            $table->json('features');
            $table->string('seo_title');
            $table->text('seo_description');
            $table->json('outcomes');
            $table->json('curriculum');
            $table->json('personas');
            $table->json('faqs');
            $table->json('related_slugs');
            $table->json('specialty_tags');
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
