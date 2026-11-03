<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_treasury_transactions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('account_id')->constrained('sys_treasury_accounts')->restrictOnDelete();
            $t->string('direction', 3); // in | out
            // income | deposit | withdrawal | adjustment | expense | transfer
            $t->string('kind', 20);
            // Always positive; `direction` carries the sign. The currency is the account's.
            $t->bigInteger('amount_minor');
            $t->date('occurred_on');
            $t->string('description', 500);
            $t->string('counterparty', 190)->nullable();
            $t->string('reference', 190)->nullable();
            // The expense this row pays for. Such rows are owned by the expense.
            $t->foreignId('expense_id')->nullable()->constrained('sys_expenses')->nullOnDelete();
            // Shared by the two legs of a transfer between accounts.
            $t->uuid('transfer_group')->nullable();
            $t->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->softDeletes();
            $t->timestamps();

            $t->index(['account_id', 'occurred_on', 'id'], 'sys_treasury_tx_running_idx');
            $t->index('occurred_on');
            $t->index('transfer_group');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_treasury_transactions');
    }
};
