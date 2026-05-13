<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_monthly_reports', function (Blueprint $t) {
            $t->id();
            $t->unsignedSmallInteger('period_year');
            $t->unsignedTinyInteger('period_month');
            $t->json('summary');
            $t->string('pdf_path', 500)->nullable();
            $t->string('xlsx_path', 500)->nullable();
            $t->timestamp('generated_at');
            $t->foreignId('generated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->unique(['period_year', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_monthly_reports');
    }
};
