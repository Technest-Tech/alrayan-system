<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $now = now();
        $rows = [
            ['key' => 'payroll.run_day_of_month',              'value' => '1',     'created_at' => $now, 'updated_at' => $now],
            ['key' => 'payroll.run_hour',                      'value' => '1',     'created_at' => $now, 'updated_at' => $now],
            ['key' => 'quality.weight.attendance',             'value' => '30',    'created_at' => $now, 'updated_at' => $now],
            ['key' => 'quality.weight.reports',                'value' => '30',    'created_at' => $now, 'updated_at' => $now],
            ['key' => 'quality.weight.retention',              'value' => '25',    'created_at' => $now, 'updated_at' => $now],
            ['key' => 'quality.weight.punctuality',            'value' => '15',    'created_at' => $now, 'updated_at' => $now],
            ['key' => 'quality.underperforming_threshold',     'value' => '70',    'created_at' => $now, 'updated_at' => $now],
            ['key' => 'quality.bonus_recommendation_threshold','value' => '90',    'created_at' => $now, 'updated_at' => $now],
            ['key' => 'quality.recommended_bonus_minor',       'value' => '50000', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'payroll.late_report_deduction_minor',   'value' => '5000',  'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('sys_settings')->upsert($rows, ['key'], ['value', 'updated_at']);
    }

    public function down(): void
    {
        DB::table('sys_settings')->whereIn('key', [
            'payroll.run_day_of_month',
            'payroll.run_hour',
            'quality.weight.attendance',
            'quality.weight.reports',
            'quality.weight.retention',
            'quality.weight.punctuality',
            'quality.underperforming_threshold',
            'quality.bonus_recommendation_threshold',
            'quality.recommended_bonus_minor',
            'payroll.late_report_deduction_minor',
        ])->delete();
    }
};
