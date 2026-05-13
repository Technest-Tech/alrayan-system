<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $rows = [
            ['key' => 'invoice.prefix',               'value' => 'INV',                'created_at' => $now, 'updated_at' => $now],
            ['key' => 'invoice.due_days',              'value' => '3',                  'created_at' => $now, 'updated_at' => $now],
            ['key' => 'invoice.suspend_after_months',  'value' => '2',                  'created_at' => $now, 'updated_at' => $now],
            ['key' => 'invoice.send_on_create',        'value' => 'true',               'created_at' => $now, 'updated_at' => $now],
            ['key' => 'pricing.base_30',               'value' => '2500',               'created_at' => $now, 'updated_at' => $now],
            ['key' => 'pricing.base_45',               'value' => '3500',               'created_at' => $now, 'updated_at' => $now],
            ['key' => 'pricing.base_60',               'value' => '5000',               'created_at' => $now, 'updated_at' => $now],
            ['key' => 'pricing.sibling_default_discount_pct', 'value' => '20',          'created_at' => $now, 'updated_at' => $now],
            ['key' => 'pricing.supported_currencies',  'value' => json_encode(['USD','EUR','CAD','GBP','EGP','AED','KWD','BHD','SAR']), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'pricing.public_site_currency',  'value' => 'USD',                'created_at' => $now, 'updated_at' => $now],
            ['key' => 'pricing.public_site_visible',   'value' => 'true',               'created_at' => $now, 'updated_at' => $now],
            ['key' => 'paymob.api_key',                'value' => '',                   'created_at' => $now, 'updated_at' => $now],
            ['key' => 'paymob.integration_id',         'value' => '',                   'created_at' => $now, 'updated_at' => $now],
            ['key' => 'paymob.webhook_hmac_secret',    'value' => '',                   'created_at' => $now, 'updated_at' => $now],
            ['key' => 'paymob.public_iframe_id',       'value' => '',                   'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('sys_settings')->upsert($rows, ['key'], ['value', 'updated_at']);
    }

    public function down(): void
    {
        DB::table('sys_settings')->whereIn('key', [
            'invoice.prefix', 'invoice.due_days', 'invoice.suspend_after_months', 'invoice.send_on_create',
            'pricing.base_30', 'pricing.base_45', 'pricing.base_60',
            'pricing.sibling_default_discount_pct', 'pricing.supported_currencies',
            'pricing.public_site_currency', 'pricing.public_site_visible',
            'paymob.api_key', 'paymob.integration_id', 'paymob.webhook_hmac_secret', 'paymob.public_iframe_id',
        ])->delete();
    }
};
