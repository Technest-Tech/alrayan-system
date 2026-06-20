<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_leads', function (Blueprint $t) {
            if (!Schema::hasColumn('sys_leads', 'age'))               $t->unsignedSmallInteger('age')->nullable()->after('whatsapp');
            if (!Schema::hasColumn('sys_leads', 'gender'))            $t->string('gender', 10)->nullable()->after('age');
            if (!Schema::hasColumn('sys_leads', 'city'))              $t->string('city', 100)->nullable()->after('country');
            if (!Schema::hasColumn('sys_leads', 'platform'))          $t->string('platform', 30)->nullable()->after('source_detail');
            if (!Schema::hasColumn('sys_leads', 'platform_url'))      $t->string('platform_url', 500)->nullable()->after('platform');
            if (!Schema::hasColumn('sys_leads', 'priority'))          $t->string('priority', 10)->default('medium')->after('platform_url');
            if (!Schema::hasColumn('sys_leads', 'notes'))             $t->text('notes')->nullable()->after('lost_notes');
            if (!Schema::hasColumn('sys_leads', 'rejection_reason'))  $t->string('rejection_reason', 30)->nullable()->after('notes');
            if (!Schema::hasColumn('sys_leads', 'package_type'))      $t->unsignedSmallInteger('package_type')->nullable()->after('rejection_reason');
            if (!Schema::hasColumn('sys_leads', 'package_hours'))     $t->unsignedSmallInteger('package_hours')->nullable()->after('package_type');
            if (!Schema::hasColumn('sys_leads', 'subscription_price')) $t->decimal('subscription_price', 10, 2)->nullable()->after('package_hours');
            if (!Schema::hasColumn('sys_leads', 'currency'))          $t->string('currency', 3)->nullable()->after('subscription_price');
            if (!Schema::hasColumn('sys_leads', 'payment_method'))    $t->string('payment_method', 20)->nullable()->after('currency');
            if (!Schema::hasColumn('sys_leads', 'is_family_lead'))    $t->boolean('is_family_lead')->default(false)->after('payment_method');
        });

        $driver = DB::getDriverName();

        // Step 1: Expand ENUM to include both old and new values so updates won't be rejected
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE sys_leads MODIFY COLUMN status ENUM('new','contacted','trial_booked','trial_completed','enrolled','lost','new_lead','interested','waiting_for_trial','waiting_for_payment','closed','not_interested') NOT NULL DEFAULT 'new'");
        } elseif ($driver === 'sqlite') {
            // SQLite enforces enums via a CHECK constraint and cannot ALTER it in place.
            // Relax the column to a plain string so the new status values are accepted,
            // keeping the test schema in parity with production.
            Schema::table('sys_leads', fn (Blueprint $t) => $t->string('status')->default('new_lead')->change());
        }

        // Step 2: Migrate old status values to new names
        DB::table('sys_leads')->where('status', 'new')->update(['status' => 'new_lead']);
        DB::table('sys_leads')->where('status', 'contacted')->update(['status' => 'interested']);
        DB::table('sys_leads')->where('status', 'trial_booked')->update(['status' => 'waiting_for_trial']);
        DB::table('sys_leads')->where('status', 'trial_completed')->update(['status' => 'waiting_for_payment']);
        DB::table('sys_leads')->where('status', 'enrolled')->update(['status' => 'closed']);

        // Step 3: Narrow ENUM to final set of new values only
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE sys_leads MODIFY COLUMN status ENUM('new_lead','interested','waiting_for_trial','waiting_for_payment','closed','not_interested','lost') NOT NULL DEFAULT 'new_lead'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        // Reverse status renames
        DB::table('sys_leads')->where('status', 'new_lead')->update(['status' => 'new']);
        DB::table('sys_leads')->where('status', 'interested')->update(['status' => 'contacted']);
        DB::table('sys_leads')->where('status', 'waiting_for_trial')->update(['status' => 'trial_booked']);
        DB::table('sys_leads')->where('status', 'waiting_for_payment')->update(['status' => 'trial_completed']);
        DB::table('sys_leads')->where('status', 'closed')->update(['status' => 'enrolled']);
        DB::table('sys_leads')->where('status', 'not_interested')->update(['status' => 'lost']);

        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE sys_leads MODIFY COLUMN status ENUM('new','contacted','trial_booked','trial_completed','enrolled','lost') NOT NULL DEFAULT 'new'");
        }

        Schema::table('sys_leads', function (Blueprint $t) {
            $t->dropColumn([
                'age', 'gender', 'city', 'platform', 'platform_url', 'priority',
                'notes', 'rejection_reason', 'package_type', 'package_hours',
                'subscription_price', 'currency', 'payment_method', 'is_family_lead',
            ]);
        });
    }
};
