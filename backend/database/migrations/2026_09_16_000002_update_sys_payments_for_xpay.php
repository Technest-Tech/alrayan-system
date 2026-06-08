<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'xpay' to the method enum
        DB::statement("ALTER TABLE sys_payments MODIFY COLUMN method ENUM('paymob','xpay','bank_transfer','paypal','vodafone_cash','instapay','wallet','other') NOT NULL");

        Schema::table('sys_payments', function (Blueprint $t) {
            $t->renameColumn('paymob_transaction_id', 'gateway_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('sys_payments', function (Blueprint $t) {
            $t->renameColumn('gateway_transaction_id', 'paymob_transaction_id');
        });

        DB::statement("ALTER TABLE sys_payments MODIFY COLUMN method ENUM('paymob','bank_transfer','paypal','vodafone_cash','instapay','wallet','other') NOT NULL");
    }
};
