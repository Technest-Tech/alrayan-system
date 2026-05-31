<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sys_students', function (Blueprint $t) {
            $t->unsignedInteger('package_hours_default')->default(0)->after('wallet_currency');
            $t->unsignedInteger('hourly_rate_minor')->default(0)->after('package_hours_default');
        });
    }

    public function down(): void
    {
        Schema::table('sys_students', function (Blueprint $t) {
            $t->dropColumn(['package_hours_default', 'hourly_rate_minor']);
        });
    }
};
