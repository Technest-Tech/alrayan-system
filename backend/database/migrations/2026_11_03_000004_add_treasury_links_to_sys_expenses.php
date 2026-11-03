<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_expenses', function (Blueprint $t) {
            // All nullable: existing expenses were never tied to an account or an item.
            $t->foreignId('account_id')->nullable()->after('category_id')
                ->constrained('sys_treasury_accounts')->nullOnDelete();
            $t->foreignId('item_id')->nullable()->after('account_id')
                ->constrained('sys_expense_items')->nullOnDelete();
            // The month an item's expense belongs to (YYYY-MM). Separate from occurred_on
            // because November's rent may well be paid on 2 December.
            $t->char('period', 7)->nullable()->after('occurred_on');
            $t->index(['item_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::table('sys_expenses', function (Blueprint $t) {
            // MySQL leans on this index for the item_id foreign key, so the key goes first.
            $t->dropForeign(['item_id']);
            $t->dropIndex(['item_id', 'period']);
            $t->dropColumn('item_id');
            $t->dropConstrainedForeignId('account_id');
            $t->dropColumn('period');
        });
    }
};
