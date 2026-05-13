<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\AuditLog as AuditLogModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 50);
        $page    = $request->integer('page', 1);

        // Build audit log query
        $auditQuery = AuditLogModel::query()
            ->select([
                DB::raw("'audit' as source"),
                'id',
                'action',
                'actor_name',
                DB::raw('NULL as target_type'),
                DB::raw('NULL as target_id'),
                DB::raw('NULL as target_label'),
                'payload as diff',
                'created_at',
            ])
            ->when($request->input('actor'), fn($q, $v) =>
                $q->where('actor_name', 'like', "%{$v}%")
            )
            ->when($request->input('action'), fn($q, $v) =>
                $q->where('action', 'like', "%{$v}%")
            )
            ->when($request->input('from'), fn($q, $v) =>
                $q->whereDate('created_at', '>=', $v)
            )
            ->when($request->input('to'), fn($q, $v) =>
                $q->whereDate('created_at', '<=', $v)
            );

        // Build spatie activity log query
        $activityQuery = Activity::query()
            ->select([
                DB::raw("'activity' as source"),
                'id',
                'event as action',
                DB::raw('NULL as actor_name'),
                'subject_type as target_type',
                'subject_id as target_id',
                DB::raw('NULL as target_label'),
                'properties as diff',
                'created_at',
            ])
            ->when($request->input('action'), fn($q, $v) =>
                $q->where('event', 'like', "%{$v}%")
            )
            ->when($request->input('from'), fn($q, $v) =>
                $q->whereDate('created_at', '>=', $v)
            )
            ->when($request->input('to'), fn($q, $v) =>
                $q->whereDate('created_at', '<=', $v)
            );

        // Union + paginate
        $combined = $auditQuery->union($activityQuery)
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $combined->items(),
            'meta' => [
                'total'        => $combined->total(),
                'per_page'     => $combined->perPage(),
                'current_page' => $combined->currentPage(),
                'last_page'    => $combined->lastPage(),
            ],
        ]);
    }

    public function show(int $id, Request $request): JsonResponse
    {
        $source = $request->input('source', 'audit');

        if ($source === 'activity') {
            $entry = Activity::findOrFail($id);
            return response()->json(['data' => [
                'id'         => $entry->id,
                'source'     => 'activity',
                'action'     => $entry->event,
                'actor'      => $entry->causer?->name ?? 'System',
                'target'     => class_basename($entry->subject_type ?? '') . '#' . $entry->subject_id,
                'diff'       => $entry->properties,
                'created_at' => $entry->created_at?->toIso8601String(),
            ]]);
        }

        $entry = AuditLogModel::findOrFail($id);
        return response()->json(['data' => [
            'id'         => $entry->id,
            'source'     => 'audit',
            'action'     => $entry->action,
            'actor'      => $entry->actor_name,
            'diff'       => $entry->payload,
            'created_at' => $entry->created_at?->toIso8601String(),
        ]]);
    }

    public function export(Request $request): JsonResponse
    {
        // Queues a background export (BuildExport handles it)
        dispatch(new \App\Jobs\System\BuildExport(
            kind: 'audit_log',
            filters: $request->only(['actor', 'action', 'from', 'to']),
            userId: $request->user()->id,
        ));

        return response()->json(['message' => 'Export queued. You will receive a notification when ready.']);
    }
}
