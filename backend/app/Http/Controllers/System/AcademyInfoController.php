<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Support\System\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class AcademyInfoController extends Controller
{
    private array $keys = [
        'academy.name',
        'academy.logo_path',
        'academy.support_email',
        'academy.support_phone',
        'academy.support_whatsapp',
        'academy.address',
        'academy.default_timezone',
        'academy.footer_text',
    ];

    public function show(): JsonResponse
    {
        $settings = [];
        foreach ($this->keys as $key) {
            $settings[$key] = Setting::get($key);
        }
        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        // JSON body uses flat dotted keys; convert to nested for proper Laravel validation
        $flat   = array_intersect_key($request->json()->all(), array_flip($this->keys));
        $nested = Arr::undot($flat);

        $validated = validator($nested, [
            'academy.name'             => ['sometimes', 'string', 'max:150'],
            'academy.support_email'    => ['sometimes', 'nullable', 'email'],
            'academy.support_phone'    => ['sometimes', 'nullable', 'string', 'max:30'],
            'academy.support_whatsapp' => ['sometimes', 'nullable', 'string', 'max:30'],
            'academy.address'          => ['sometimes', 'nullable', 'string', 'max:500'],
            'academy.default_timezone' => ['sometimes', 'nullable', 'timezone'],
            'academy.footer_text'      => ['sometimes', 'nullable', 'string', 'max:500'],
        ])->validate();

        foreach (Arr::dot($validated) as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json(['message' => 'Academy settings saved.']);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate(['logo' => ['required', 'file', 'mimes:svg,png,jpg,jpeg', 'max:2048']]);

        $path = $request->file('logo')->store('academy/logo', 'public');
        Setting::set('academy.logo_path', $path);

        return response()->json(['data' => ['logo_path' => $path]]);
    }
}
