<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_teachers', function (Blueprint $t) {
            $t->string('zoom_link', 500)->nullable()->after('cv_url');
        });
    }

    public function down(): void
    {
        Schema::table('sys_teachers', function (Blueprint $t) {
            $t->dropColumn('zoom_link');
        });
    }
};
