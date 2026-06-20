<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_teachers', function (Blueprint $table) {
            $table->boolean('accepts_new_students')->default(true)->after('is_active');
            $table->string('currency', 3)->nullable()->after('hourly_rate');
        });
    }

    public function down(): void
    {
        Schema::table('sys_teachers', function (Blueprint $table) {
            $table->dropColumn(['accepts_new_students', 'currency']);
        });
    }
};
