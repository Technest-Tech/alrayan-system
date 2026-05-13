<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_invoices', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained('sys_students')->restrictOnDelete();
            $t->string('invoice_number', 32)->unique();
            $t->enum('type', ['advance', 'monthly', 'reactivation', 'manual']);
            $t->unsignedSmallInteger('period_year')->nullable();
            $t->unsignedTinyInteger('period_month')->nullable();
            $t->char('currency', 3);
            $t->bigInteger('subtotal_minor')->default(0);
            $t->bigInteger('discount_minor')->default(0);
            $t->bigInteger('wallet_credit_minor')->default(0);
            $t->bigInteger('total_minor');
            $t->enum('status', ['draft','sent','paid','overdue','void'])->default('draft');
            $t->timestamp('issued_at')->nullable();
            $t->timestamp('due_at');
            $t->timestamp('paid_at')->nullable();
            $t->timestamp('voided_at')->nullable();
            $t->string('voided_reason')->nullable();
            $t->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->json('snapshot')->nullable();
            $t->softDeletes();
            $t->timestamps();
            $t->index(['student_id', 'status']);
            $t->index(['status', 'due_at']);
            $t->index(['period_year', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_invoices');
    }
};
