<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_treasury_transactions', function (Blueprint $t) {
            // What posted this row automatically: a paid package or a transferred payroll.
            $t->string('source_type', 20)->nullable()->after('transfer_group');
            $t->unsignedBigInteger('source_id')->nullable()->after('source_type');
            $t->index(['source_type', 'source_id']);
        });

        Schema::table('sys_expense_items', function (Blueprint $t) {
            $t->boolean('auto_record')->default(false)->after('due_day');
            // Only occurrences due on or after this date are recorded automatically, so turning
            // it on after this month's due date can't post a payment already made by hand.
            $t->date('auto_record_since')->nullable()->after('auto_record');
        });
    }

    public function down(): void
    {
        Schema::table('sys_expense_items', function (Blueprint $t) {
            $t->dropColumn(['auto_record', 'auto_record_since']);
        });

        Schema::table('sys_treasury_transactions', function (Blueprint $t) {
            $t->dropIndex(['source_type', 'source_id']);
            $t->dropColumn(['source_type', 'source_id']);
        });
    }
};
