<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_paymob_payment_links', function (Blueprint $t) {
            $t->id();
            $t->foreignId('invoice_id')->constrained('sys_invoices')->cascadeOnDelete();
            $t->string('paymob_order_id', 64)->nullable();
            $t->string('payment_url', 800);
            $t->timestamp('expires_at')->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
            $t->index(['invoice_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_paymob_payment_links');
    }
};
