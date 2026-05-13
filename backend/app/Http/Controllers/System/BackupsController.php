<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class BackupsController extends Controller
{
    public function show(): JsonResponse
    {
        $lastBackupFile = config('system.backup.last_backup_marker', storage_path('app/last-backup.txt'));
        $lastAt = file_exists($lastBackupFile)
            ? date('c', filemtime($lastBackupFile))
            : null;

        return response()->json([
            'last_backup_at' => $lastAt,
            'storage'        => config('system.backup.storage', 'Backblaze B2'),
        ]);
    }

    public function runNow(Request $request): JsonResponse
    {
        $script = config('system.backup.script', base_path('scripts/backup.sh'));

        if (!file_exists($script)) {
            return response()->json(['message' => 'Backup script not found.'], 500);
        }

        dispatch(function () use ($script) {
            Process::run("bash {$script}");
        })->afterResponse();

        return response()->json(['message' => 'Backup started in the background.']);
    }
}
