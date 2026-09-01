<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Support\System\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class SiteSettingsController extends Controller
{
    /** Public-site contact details + social links, stored as flat `site.*` keys. */
    private array $keys = [
        'site.contact_email',
        'site.contact_phone',
        'site.contact_whatsapp',
        'site.contact_address',
        'site.social_facebook',
        'site.social_instagram',
        'site.social_youtube',
        'site.social_twitter',
        'site.social_tiktok',
        'site.social_telegram',
    ];

    public function show(): JsonResponse
    {
        $data = [];
        foreach ($this->keys as $key) {
            $data[$key] = Setting::get($key, '');
        }

        return response()->json(['data' => $data]);
    }

    public function update(Request $request): JsonResponse
    {
        // Flat dotted keys → treat empty strings as null → nest for Laravel validation.
        $flat = array_intersect_key($request->json()->all(), array_flip($this->keys));
        $flat = array_map(fn ($v) => $v === '' ? null : $v, $flat);
        $nested = Arr::undot($flat);

        $validated = validator($nested, [
            'site.contact_email'    => ['sometimes', 'nullable', 'email', 'max:255'],
            'site.contact_phone'    => ['sometimes', 'nullable', 'string', 'max:40'],
            'site.contact_whatsapp' => ['sometimes', 'nullable', 'string', 'max:40'],
            'site.contact_address'  => ['sometimes', 'nullable', 'string', 'max:500'],
            'site.social_facebook'  => ['sometimes', 'nullable', 'url', 'max:255'],
            'site.social_instagram' => ['sometimes', 'nullable', 'url', 'max:255'],
            'site.social_youtube'   => ['sometimes', 'nullable', 'url', 'max:255'],
            'site.social_twitter'   => ['sometimes', 'nullable', 'url', 'max:255'],
            'site.social_tiktok'    => ['sometimes', 'nullable', 'url', 'max:255'],
            'site.social_telegram'  => ['sometimes', 'nullable', 'url', 'max:255'],
        ])->validate();

        foreach (Arr::dot($validated) as $key => $value) {
            Setting::set($key, $value ?? '');
        }

        return response()->json(['message' => 'Site settings saved.']);
    }
}
