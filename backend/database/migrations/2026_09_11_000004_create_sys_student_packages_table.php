<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sys_student_packages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained('sys_students')->cascadeOnDelete();
            $t->unsignedSmallInteger('package_number');
            $t->unsignedInteger('package_hours');
            $t->unsignedInteger('tariff_at_time');
            $t->char('currency', 3)->default('USD');
            $t->enum('status', ['pending', 'paid'])->default('pending');
            $t->boolean('needs_reconfirmation')->default(false);
            $t->timestamp('paid_at')->nullable();
            $t->softDeletes();
            $t->timestamps();

            $t->unique(['student_id', 'package_number']);
            $t->index(['student_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_student_packages');
    }
};
