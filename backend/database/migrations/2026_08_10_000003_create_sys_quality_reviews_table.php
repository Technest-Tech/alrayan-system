<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sys_quality_reviews', function (Blueprint $t) {
            $t->id();
            $t->foreignId('teacher_id')->constrained('sys_teachers')->cascadeOnDelete();
            $t->unsignedSmallInteger('period_year');
            $t->unsignedTinyInteger('period_month');
            $t->foreignId('reviewer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->enum('source', ['manual', 'auto'])->default('manual');
            $t->unsignedTinyInteger('attendance_score');
            $t->unsignedTinyInteger('reports_score');
            $t->unsignedTinyInteger('retention_score');
            $t->unsignedTinyInteger('punctuality_score');
            $t->unsignedTinyInteger('overall_score');
            $t->json('inputs')->nullable();
            $t->text('notes')->nullable();
            $t->bigInteger('bonus_recommendation_minor')->default(0);
            $t->timestamps();
            $t->index(['teacher_id', 'period_year', 'period_month']);
            $t->index(['overall_score']);
        });
    }

    public function down(): void { Schema::dropIfExists('sys_quality_reviews'); }
};
