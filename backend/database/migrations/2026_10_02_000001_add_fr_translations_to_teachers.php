<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            // Scalar free-text French counterparts (nullable — English is the fallback).
            $table->string('role_fr')->nullable()->after('role');
            $table->string('title_fr')->nullable()->after('title');
            $table->string('country_fr')->nullable()->after('country');
            $table->text('bio_fr')->nullable()->after('bio');
            $table->string('credentials_fr')->nullable()->after('credentials');
            $table->string('quote_fr')->nullable()->after('quote');
            $table->text('about_fr')->nullable()->after('about');
            $table->text('teaching_style_fr')->nullable()->after('teaching_style');
            $table->text('strengths_fr')->nullable()->after('strengths');
            // JSON array French counterparts.
            $table->json('specialties_fr')->nullable()->after('specialties');
            $table->json('languages_fr')->nullable()->after('languages');
            $table->json('tags_fr')->nullable()->after('tags');
        });

        Schema::table('teacher_reviews', function (Blueprint $table) {
            $table->text('text_fr')->nullable()->after('text');
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn([
                'role_fr', 'title_fr', 'country_fr', 'bio_fr', 'credentials_fr',
                'quote_fr', 'about_fr', 'teaching_style_fr', 'strengths_fr',
                'specialties_fr', 'languages_fr', 'tags_fr',
            ]);
        });

        Schema::table('teacher_reviews', function (Blueprint $table) {
            $table->dropColumn('text_fr');
        });
    }
};
