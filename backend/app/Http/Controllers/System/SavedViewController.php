<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\AuditLog as AuditLogModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SavedViewController extends Controller
{
    private function settingsKey(string $context, bool $global = false): string
    {
        return $global
            ? "saved_views.{$context}.global"
            : 'saved_views.' . $context . '.' . auth()->id();
    }

    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $context = $request->string('context', 'students')->value();

        $personal = $this->getViews($this->settingsKey($context));
        $global   = auth()->user()->role !== 'teacher'
            ? $this->getViews($this->settingsKey($context, true))
            : [];

        return response()->json(['data' => array_merge($personal, $global)]);
    }

    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->validate([
            'context' => ['required', 'string', 'in:students,teachers,invoices,sessions'],
            'name'    => ['required', 'string', 'max:100'],
            'params'  => ['required', 'string'],
            'shared'  => ['nullable', 'boolean'],
        ]);

        $shared = ($data['shared'] ?? false) && auth()->user()->role === 'admin';
        $key    = $this->settingsKey($data['context'], $shared);
        $views  = $this->getViews($key);

        $id = \Illuminate\Support\Str::uuid()->toString();
        $views[$id] = [
            'id'      => $id,
            'name'    => $data['name'],
            'params'  => $data['params'],
            'shared'  => $shared,
            'user_id' => auth()->id(),
        ];

        $this->saveViews($key, $views);

        return response()->json(['data' => $views[$id]], 201);
    }

    public function destroy(Request $request, string $id): \Illuminate\Http\JsonResponse
    {
        $context = $request->string('context', 'students')->value();

        foreach ([false, true] as $global) {
            $key   = $this->settingsKey($context, $global);
            $views = $this->getViews($key);
            if (isset($views[$id])) {
                if ($views[$id]['user_id'] !== auth()->id() && auth()->user()->role !== 'admin') {
                    abort(403);
                }
                unset($views[$id]);
                $this->saveViews($key, $views);
                return response()->json(['deleted' => true]);
            }
        }

        abort(404);
    }

    private function getViews(string $key): array
    {
        $row = DB::table('sys_settings')->where('key', $key)->first();
        return $row ? json_decode($row->value, true) ?? [] : [];
    }

    private function saveViews(string $key, array $views): void
    {
        DB::table('sys_settings')->updateOrInsert(
            ['key' => $key],
            ['value' => json_encode($views), 'updated_at' => now()]
        );
    }
}
