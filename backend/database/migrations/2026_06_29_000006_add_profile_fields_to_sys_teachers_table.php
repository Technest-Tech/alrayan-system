<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_teachers', function (Blueprint $t) {
            $t->unsignedInteger('hourly_rate')->default(0)->after('per_minute_rate_60');
            $t->string('cv_url')->nullable()->after('hourly_rate');
        });
    }

    public function down(): void
    {
        Schema::table('sys_teachers', function (Blueprint $t) {
            $t->dropColumn(['hourly_rate', 'cv_url']);
        });
    }
};
