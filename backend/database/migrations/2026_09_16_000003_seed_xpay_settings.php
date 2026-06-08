<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now  = now();
        $rows = [
            ['key' => 'xpay.api_key',            'value' => '', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'xpay.community_id',        'value' => '', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'xpay.variable_amount_id',  'value' => '', 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'xpay.redirect_url',        'value' => '', 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('sys_settings')->upsert($rows, ['key'], ['value', 'updated_at']);
    }

    public function down(): void
    {
        DB::table('sys_settings')->whereIn('key', [
            'xpay.api_key', 'xpay.community_id', 'xpay.variable_amount_id', 'xpay.redirect_url',
        ])->delete();
    }
};
