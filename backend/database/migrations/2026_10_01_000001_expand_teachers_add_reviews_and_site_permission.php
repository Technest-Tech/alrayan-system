<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        // ── Expand the marketing teachers table with rich, editable profile fields ──
        Schema::table('teachers', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('id');
            $table->string('title')->nullable()->after('role');
            $table->string('country')->default('Egypt')->after('title');
            $table->decimal('rating', 3, 1)->default(5.0)->after('country');
            $table->unsignedInteger('reviews_count')->default(0)->after('rating');
            $table->unsignedInteger('hourly_rate')->default(10)->after('reviews_count');
            $table->string('currency', 3)->default('EUR')->after('hourly_rate');
            $table->json('tags')->nullable()->after('languages');
            $table->boolean('elite')->default(false)->after('featured');
            $table->boolean('for_children')->default(false)->after('elite');
            $table->boolean('free_trial')->default(true)->after('for_children');
            $table->unsignedInteger('courses_given')->default(0)->after('students_count');
            $table->unsignedInteger('teaching_hours')->default(0)->after('courses_given');
            $table->string('quote')->nullable()->after('teaching_hours');
            $table->text('about')->nullable()->after('quote');
            $table->text('teaching_style')->nullable()->after('about');
            $table->text('strengths')->nullable()->after('teaching_style');
        });

        // Backfill slugs from existing names (seeder later replaces with clean slugs).
        foreach (DB::table('teachers')->get(['id', 'name']) as $row) {
            DB::table('teachers')->where('id', $row->id)->update([
                'slug' => Str::slug($row->name) . '-' . $row->id,
            ]);
        }

        // ── Reviews shown on each public teacher profile ──
        Schema::create('teacher_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->string('author');
            $table->unsignedTinyInteger('rating')->default(5);
            $table->text('text');
            $table->boolean('approved')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // ── Permission: manage the public site (teachers + reviews) ──
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        $perm = Permission::firstOrCreate(['name' => 'site.manage', 'guard_name' => 'web']);
        if ($admin = Role::where('name', 'admin')->where('guard_name', 'web')->first()) {
            $admin->givePermissionTo($perm);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_reviews');

        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn([
                'slug', 'title', 'country', 'rating', 'reviews_count', 'hourly_rate',
                'currency', 'tags', 'elite', 'for_children', 'free_trial',
                'courses_given', 'teaching_hours', 'quote', 'about', 'teaching_style', 'strengths',
            ]);
        });

        if ($perm = Permission::where('name', 'site.manage')->where('guard_name', 'web')->first()) {
            $perm->delete();
        }
    }
};
