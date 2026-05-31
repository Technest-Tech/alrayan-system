<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_invoices', function (Blueprint $t) {
            $t->string('payment_token', 64)->nullable()->unique()->after('invoice_number');
        });

        // Back-fill tokens for existing invoices
        \App\Models\System\Invoice::withTrashed()->whereNull('payment_token')->each(function ($invoice) {
            $invoice->updateQuietly(['payment_token' => Str::random(48)]);
        });
    }

    public function down(): void
    {
        Schema::table('sys_invoices', function (Blueprint $t) {
            $t->dropColumn('payment_token');
        });
    }
};
