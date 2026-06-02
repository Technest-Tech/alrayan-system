<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_sessions', function (Blueprint $t) {
            // Whether a student-side absence was excused (apology received ≥ window).
            // Only meaningful when status='absent' and cancelled_by='student'.
            $t->boolean('apology_received')->default(false)->after('cancelled_by');
            $t->timestamp('apology_at')->nullable()->after('apology_received');
        });
    }

    public function down(): void
    {
        Schema::table('sys_sessions', function (Blueprint $t) {
            $t->dropColumn(['apology_received', 'apology_at']);
        });
    }
};
