<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sys_teachers', function (Blueprint $t) {
            $t->text('qualifications')->nullable()->after('user_id');
            $t->json('teachable_course_ids')->nullable()->after('qualifications');
            $t->enum('payment_method', ['vodafone_cash', 'instapay', 'wallet_other'])->default('vodafone_cash')->after('teachable_course_ids');
            $t->string('payment_account_details')->nullable()->after('payment_method');
            $t->unsignedInteger('per_minute_rate_30')->default(0)->after('payment_account_details');
            $t->unsignedInteger('per_minute_rate_45')->default(0)->after('per_minute_rate_30');
            $t->unsignedInteger('per_minute_rate_60')->default(0)->after('per_minute_rate_45');
            $t->foreignId('whatsapp_group_id')->nullable()->after('per_minute_rate_60');
            $t->softDeletes()->after('is_active');
            $t->index(['is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('sys_teachers', function (Blueprint $t) {
            $t->dropColumn([
                'qualifications', 'teachable_course_ids', 'payment_method',
                'payment_account_details', 'per_minute_rate_30', 'per_minute_rate_45',
                'per_minute_rate_60', 'whatsapp_group_id', 'deleted_at',
            ]);
        });
    }
};
