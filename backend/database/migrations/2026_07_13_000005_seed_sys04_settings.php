<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $defaults = [
            'session_reminder_offset_minutes'    => 60,
            'report_overdue_after_hours'         => 24,
            'session_materialization_window_days'=> 14,
            'attendance_absence_threshold'       => 3,
        ];

        foreach ($defaults as $key => $value) {
            DB::table('sys_settings')->updateOrInsert(
                ['key' => $key],
                ['value' => (string) $value, 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }

    public function down(): void
    {
        DB::table('sys_settings')->whereIn('key', [
            'session_reminder_offset_minutes',
            'report_overdue_after_hours',
            'session_materialization_window_days',
            'attendance_absence_threshold',
        ])->delete();
    }
};
