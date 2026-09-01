<?php

use App\Support\System\Setting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $defaults = [
            'site.contact_email'    => 'alrayanacadmy@gmail.com',
            'site.contact_phone'    => '+20 127 919 3105',
            'site.contact_whatsapp' => '201279193105',
            'site.contact_address'  => 'Online — Serving students worldwide',
            'site.social_facebook'  => 'https://www.facebook.com/alrayanaquran/',
            'site.social_instagram' => 'https://www.instagram.com/rayan_academyy/',
            'site.social_youtube'   => 'https://youtube.com/@alrayanacademy',
            'site.social_twitter'   => 'https://twitter.com/alrayanacademy',
            'site.social_tiktok'    => '',
            'site.social_telegram'  => '',
        ];

        foreach ($defaults as $key => $value) {
            if (Setting::get($key) === null) {
                Setting::set($key, $value);
            }
        }
    }

    public function down(): void
    {
        \Illuminate\Support\Facades\DB::table('sys_settings')->where('key', 'like', 'site.%')->delete();
    }
};
