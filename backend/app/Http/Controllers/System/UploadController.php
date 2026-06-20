<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    /**
     * Store an uploaded file (photo / document) and return its public URL.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file'   => ['required', 'file', 'mimes:png,jpg,jpeg,gif,webp,pdf', 'max:4096'],
            'folder' => ['nullable', 'string', 'in:photos,documents'],
        ]);

        $folder = $request->input('folder', 'documents');
        $path   = $request->file('file')->store("system/{$folder}", 'public');

        // Build the absolute URL from the actual request host so it works
        // regardless of how APP_URL is configured (e.g. it omits the :8000 port,
        // which makes the public disk's APP_URL-based url() unreachable).
        $base = rtrim(config('app.asset_url') ?: $request->getSchemeAndHttpHost(), '/');

        return response()->json([
            'data' => [
                'path' => $path,
                'url'  => $base . '/storage/' . ltrim($path, '/'),
            ],
        ]);
    }
}
