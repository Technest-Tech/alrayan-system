<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Salary is now hours × the rate of the hour tier those hours reach
 * (App\Services\System\SalaryTiers). The tier a slip was paid at lives in
 * `snapshot`, but hours / rate / currency get real columns so the payroll list
 * can show and sort them without unpacking JSON.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_payrolls', function (Blueprint $table) {
            $table->decimal('total_hours', 8, 2)->default(0)->after('total_minutes');
            $table->unsignedInteger('hourly_rate_minor')->default(0)->after('total_hours');
            $table->unsignedTinyInteger('tier_index')->nullable()->after('hourly_rate_minor');
            // Existing payrolls were denominated in EGP. New ladder payrolls
            // explicitly persist USD from PayrollGenerator.
            $table->string('currency', 3)->default('EGP')->after('tier_index');
        });

        // Give legacy rows useful derived values without pretending they were
        // paid on one of the new tiers.
        DB::table('sys_payrolls')
            ->select(['id', 'total_minutes', 'base_salary_minor'])
            ->orderBy('id')
            ->chunkById(200, function ($payrolls) {
                foreach ($payrolls as $payroll) {
                    $hours = round(((int) $payroll->total_minutes) / 60, 2);
                    DB::table('sys_payrolls')
                        ->where('id', $payroll->id)
                        ->update([
                            'total_hours'       => $hours,
                            'hourly_rate_minor' => $hours > 0
                                ? (int) round(((int) $payroll->base_salary_minor) / $hours)
                                : 0,
                            'currency'          => 'EGP',
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('sys_payrolls', function (Blueprint $table) {
            $table->dropColumn(['total_hours', 'hourly_rate_minor', 'tier_index', 'currency']);
        });
    }
};
