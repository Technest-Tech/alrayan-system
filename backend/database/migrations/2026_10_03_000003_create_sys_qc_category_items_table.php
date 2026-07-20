<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_qc_category_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('category_id')->constrained('sys_qc_categories')->cascadeOnDelete();
            $t->string('label');
            $t->unsignedSmallInteger('penalty')->default(0); // % deducted when this item is left unchecked
            $t->string('special_rule_key')->nullable();      // links to sys_qc_special_rules.rule_key (e.g. camera_cap)
            $t->unsignedSmallInteger('sort_order')->default(0);
            $t->boolean('is_active')->default(true);
            $t->timestamps();

            $t->index(['category_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_qc_category_items');
    }
};
