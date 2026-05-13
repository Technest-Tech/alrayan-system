<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_wallet_transactions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained('sys_students')->restrictOnDelete();
            $t->bigInteger('amount_minor');
            $t->char('currency', 3);
            $t->enum('source', ['overpayment','manual_credit','manual_debit','invoice_credit','adjustment','refund']);
            $t->nullableMorphs('source_reference', 'wt_src_ref_idx');
            $t->string('note')->nullable();
            $t->bigInteger('balance_after_minor');
            $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->index(['student_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_wallet_transactions');
    }
};
