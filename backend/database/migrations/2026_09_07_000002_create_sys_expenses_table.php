<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_expenses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('category_id')->constrained('sys_expense_categories')->restrictOnDelete();
            $t->bigInteger('amount_minor');
            $t->char('currency', 3);
            $t->string('description');
            $t->date('occurred_on');
            $t->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->json('attachments')->nullable();
            $t->softDeletes();
            $t->timestamps();
            $t->index(['occurred_on']);
            $t->index(['category_id', 'occurred_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_expenses');
    }
};
