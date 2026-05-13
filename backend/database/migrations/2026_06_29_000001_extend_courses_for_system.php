<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $t) {
            $t->boolean('is_active_for_system')->default(true)->after('slug');
            $t->index(['is_active_for_system']);
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $t) {
            $t->dropIndex(['is_active_for_system']);
            $t->dropColumn('is_active_for_system');
        });
    }
};
