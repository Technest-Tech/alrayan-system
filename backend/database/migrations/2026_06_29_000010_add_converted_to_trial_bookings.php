<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trial_bookings', function (Blueprint $t) {
            $t->foreignId('converted_to_student_id')->nullable()->constrained('sys_students')->nullOnDelete()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('trial_bookings', function (Blueprint $t) {
            $t->dropConstrainedForeignId('converted_to_student_id');
        });
    }
};
