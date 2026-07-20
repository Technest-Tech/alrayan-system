<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sys_qc_special_rules', function (Blueprint $t) {
            $t->id();
            $t->string('rule_key')->unique();     // e.g. camera_cap
            $t->string('rule_type', 24)->default('score_cap'); // kept as string (validated in the app)
            $t->string('label');
            $t->unsignedSmallInteger('cap_value')->default(0); // % ceiling applied when the linked item is unchecked
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_qc_special_rules');
    }
};
