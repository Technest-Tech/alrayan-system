<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per checklist item captured at evaluation time. We snapshot the
        // label/penalty so past scores stay reproducible even after categories change.
        Schema::create('sys_qc_evaluation_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('evaluation_id')->constrained('sys_qc_evaluations')->cascadeOnDelete();
            $t->foreignId('category_item_id')->nullable()->constrained('sys_qc_category_items')->nullOnDelete();
            $t->string('category_name');
            $t->string('item_label');
            $t->unsignedSmallInteger('penalty')->default(0);
            $t->string('special_rule_key')->nullable();
            $t->boolean('checked')->default(true);
            $t->timestamps();

            $t->index(['evaluation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_qc_evaluation_items');
    }
};
