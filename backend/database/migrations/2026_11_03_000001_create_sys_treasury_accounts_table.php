<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_treasury_accounts', function (Blueprint $t) {
            $t->id();
            $t->string('name', 120);
            $t->string('type', 20)->default('bank');
            $t->char('currency', 3);
            // Signed: an account can legitimately open overdrawn. The current balance is
            // never stored — it is always opening + the sum of the account's transactions.
            $t->bigInteger('opening_balance_minor')->default(0);
            $t->date('opening_date');
            $t->string('identifier', 190)->nullable();
            $t->text('notes')->nullable();
            $t->boolean('is_active')->default(true);
            $t->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->softDeletes();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_treasury_accounts');
    }
};
