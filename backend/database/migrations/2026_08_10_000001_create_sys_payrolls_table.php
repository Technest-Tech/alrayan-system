<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sys_payrolls', function (Blueprint $t) {
            $t->id();
            $t->foreignId('teacher_id')->constrained('sys_teachers')->restrictOnDelete();
            $t->unsignedSmallInteger('period_year');
            $t->unsignedTinyInteger('period_month');
            $t->unsignedInteger('total_sessions');
            $t->unsignedInteger('total_minutes');
            $t->json('breakdown_by_duration');
            $t->bigInteger('base_salary_minor');
            $t->bigInteger('bonuses_minor')->default(0);
            $t->bigInteger('deductions_minor')->default(0);
            $t->bigInteger('net_salary_minor');
            $t->enum('status', ['pending', 'approved', 'rejected', 'transferred'])->default('pending');
            $t->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('approved_at')->nullable();
            $t->timestamp('rejected_at')->nullable();
            $t->text('rejection_reason')->nullable();
            $t->timestamp('transferred_at')->nullable();
            $t->string('transfer_reference', 200)->nullable();
            $t->foreignId('transferred_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->json('snapshot')->nullable();
            $t->softDeletes();
            $t->timestamps();
            $t->unique(['teacher_id', 'period_year', 'period_month']);
            $t->index(['status', 'period_year', 'period_month']);
        });
    }

    public function down(): void { Schema::dropIfExists('sys_payrolls'); }
};
