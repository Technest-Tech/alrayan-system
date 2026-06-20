<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Support\System\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SectionsController extends Controller
{
    private const KEY = 'leads.sections';

    /** Default sections seeded the first time the list is read. */
    private const DEFAULTS = [
        ['id' => 'arabic',  'name' => 'Arabic'],
        ['id' => 'english', 'name' => 'English'],
    ];

    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->current()]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sections'        => ['present', 'array'],
            'sections.*.id'   => ['nullable', 'string', 'max:60'],
            'sections.*.name' => ['required', 'string', 'max:80'],
        ]);

        $sections = [];
        foreach ($validated['sections'] as $section) {
            $name = trim($section['name']);
            if ($name === '') {
                continue;
            }
            $id = isset($section['id']) && $section['id'] !== ''
                ? Str::slug($section['id'])
                : Str::slug($name);
            $sections[$id] = ['id' => $id, 'name' => $name];
        }

        $sections = array_values($sections);
        Setting::set(self::KEY, $sections);

        return response()->json(['data' => $sections, 'message' => 'Sections saved.']);
    }

    /** @return array<int, array{id: string, name: string}> */
    private function current(): array
    {
        $raw = Setting::get(self::KEY);
        if ($raw === null) {
            Setting::set(self::KEY, self::DEFAULTS);
            return self::DEFAULTS;
        }

        $decoded = is_array($raw) ? $raw : json_decode($raw, true);
        return is_array($decoded) ? $decoded : self::DEFAULTS;
    }
}
