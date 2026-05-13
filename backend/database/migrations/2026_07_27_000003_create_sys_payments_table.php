<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('invoice_id')->constrained('sys_invoices')->restrictOnDelete();
            $t->bigInteger('amount_minor');
            $t->char('currency', 3);
            $t->enum('method', ['paymob','bank_transfer','paypal','vodafone_cash','instapay','wallet','other']);
            $t->string('reference', 200)->nullable();
            $t->string('paymob_transaction_id', 100)->nullable()->unique();
            $t->timestamp('paid_at');
            $t->foreignId('recorded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->json('payload')->nullable();
            $t->softDeletes();
            $t->timestamps();
            $t->index(['invoice_id', 'paid_at']);
            $t->index(['method', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_payments');
    }
};
