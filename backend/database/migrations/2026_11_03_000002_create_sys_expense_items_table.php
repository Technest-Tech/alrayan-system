<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_expense_items', function (Blueprint $t) {
            $t->id();
            $t->string('name', 150);
            $t->foreignId('category_id')->constrained('sys_expense_categories')->restrictOnDelete();
            // fixed = the same amount every month (rent, subscriptions);
            // variable = the amount is typed each time it is recorded (ads, electricity).
            $t->string('type', 10)->default('fixed');
            $t->bigInteger('default_amount_minor')->nullable();
            $t->char('currency', 3);
            $t->foreignId('default_account_id')->nullable()->constrained('sys_treasury_accounts')->nullOnDelete();
            $t->unsignedTinyInteger('due_day')->nullable();
            $t->boolean('is_active')->default(true);
            $t->text('notes')->nullable();
            $t->softDeletes();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_expense_items');
    }
};
