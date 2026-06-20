<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Split the combined `trial_free` lesson status into two distinct statuses:
     *   - `trial`: not consumed from the student package, not paid to the teacher (counted only).
     *   - `free` : not consumed from the student package, but paid to the teacher (counted).
     * Also adds a flexible `trial_evaluation` JSON column to capture the trial assessment.
     */
    public function up(): void
    {
        Schema::table('sys_lessons', function (Blueprint $table) {
            if (! Schema::hasColumn('sys_lessons', 'trial_evaluation')) {
                $table->json('trial_evaluation')->nullable()->after('subject_details');
            }
        });

        // Legacy combined status → `trial` (the conservative default; a trial does not pay the teacher).
        DB::table('sys_lessons')->where('status', 'trial_free')->update(['status' => 'trial']);
    }

    public function down(): void
    {
        // Collapse both new statuses back into the legacy combined value.
        DB::table('sys_lessons')->whereIn('status', ['trial', 'free'])->update(['status' => 'trial_free']);

        Schema::table('sys_lessons', function (Blueprint $table) {
            if (Schema::hasColumn('sys_lessons', 'trial_evaluation')) {
                $table->dropColumn('trial_evaluation');
            }
        });
    }
};
