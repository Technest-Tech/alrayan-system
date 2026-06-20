<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Default expense categories
        $defaults = [
            ['slug' => 'advertising_marketing',   'name' => 'Advertising / Marketing'],
            ['slug' => 'hosting_domain',           'name' => 'Hosting & Domain'],
            ['slug' => 'zoom_subscription',        'name' => 'Zoom subscription'],
            ['slug' => 'wassender_subscription',   'name' => 'wassender subscription'],
            ['slug' => 'tools_software',           'name' => 'Tools & Software'],
            ['slug' => 'office_supplies',          'name' => 'Office supplies'],
            ['slug' => 'professional_services',    'name' => 'Professional services'],
            ['slug' => 'other',                    'name' => 'Other'],
        ];

        foreach ($defaults as $cat) {
            DB::table('sys_expense_categories')->insertOrIgnore([
                'name'       => $cat['name'],
                'slug'       => $cat['slug'],
                'is_default' => true,
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Academy info settings
        $academySettings = [
            'academy.name'             => 'Azhary',
            'academy.logo_path'        => null,
            'academy.support_email'    => '',
            'academy.support_phone'    => '',
            'academy.support_whatsapp' => '',
            'academy.address'          => '',
            'academy.default_timezone' => 'Africa/Cairo',
            'academy.footer_text'      => 'Thank you for choosing Azhary.',
            'certificate.prefix'       => 'CRT',
            'reports.base_currency'    => 'EGP',
            'sentry.dsn'               => '',
            'sentry.environment'       => 'production',
        ];

        foreach ($academySettings as $key => $value) {
            DB::table('sys_settings')->insertOrIgnore([
                'key'        => $key,
                'value'      => $value,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('sys_expense_categories')->where('is_default', true)->delete();

        $keys = [
            'academy.name', 'academy.logo_path', 'academy.support_email',
            'academy.support_phone', 'academy.support_whatsapp', 'academy.address',
            'academy.default_timezone', 'academy.footer_text', 'certificate.prefix',
            'reports.base_currency', 'sentry.dsn', 'sentry.environment',
        ];
        DB::table('sys_settings')->whereIn('key', $keys)->delete();
    }
};
