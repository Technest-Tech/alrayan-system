<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\System\Setting;
use Illuminate\Http\JsonResponse;

class SiteSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'data' => [
                'contact' => [
                    'email'    => Setting::get('site.contact_email', ''),
                    'phone'    => Setting::get('site.contact_phone', ''),
                    'whatsapp' => Setting::get('site.contact_whatsapp', ''),
                    'address'  => Setting::get('site.contact_address', ''),
                ],
                'social' => [
                    'facebook'  => Setting::get('site.social_facebook', ''),
                    'instagram' => Setting::get('site.social_instagram', ''),
                    'youtube'   => Setting::get('site.social_youtube', ''),
                    'twitter'   => Setting::get('site.social_twitter', ''),
                    'tiktok'    => Setting::get('site.social_tiktok', ''),
                    'telegram'  => Setting::get('site.social_telegram', ''),
                ],
            ],
        ]);
    }
}
