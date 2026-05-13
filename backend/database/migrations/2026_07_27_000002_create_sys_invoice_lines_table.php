<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_invoice_lines', function (Blueprint $t) {
            $t->id();
            $t->foreignId('invoice_id')->constrained('sys_invoices')->cascadeOnDelete();
            $t->string('description');
            $t->enum('kind', ['monthly','pro_rata','outstanding','adjustment','discount']);
            $t->unsignedSmallInteger('quantity')->default(1);
            $t->unsignedSmallInteger('session_duration_min')->nullable();
            $t->bigInteger('unit_price_minor');
            $t->bigInteger('line_total_minor');
            $t->foreignId('source_invoice_id')->nullable()->constrained('sys_invoices')->nullOnDelete();
            $t->timestamps();
            $t->index(['invoice_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_invoice_lines');
    }
};
