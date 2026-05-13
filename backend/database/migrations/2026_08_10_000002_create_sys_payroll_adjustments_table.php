<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sys_payroll_adjustments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('payroll_id')->constrained('sys_payrolls')->cascadeOnDelete();
            $t->enum('type', ['bonus', 'deduction']);
            $t->enum('category', [
                'performance', 'retention', 'reports_consistency', 'tenure', 'other_bonus',
                'unauthorized_absence', 'late_report', 'late_arrival', 'quality_issue', 'other_deduction',
            ]);
            $t->bigInteger('amount_minor');
            $t->text('reason');
            $t->foreignId('added_by_user_id')->constrained('users')->restrictOnDelete();
            $t->softDeletes();
            $t->timestamps();
            $t->index(['payroll_id', 'type']);
        });
    }

    public function down(): void { Schema::dropIfExists('sys_payroll_adjustments'); }
};
