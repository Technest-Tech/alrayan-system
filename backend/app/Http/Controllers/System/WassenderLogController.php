<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\WassenderLogResource;
use App\Jobs\System\SendWassenderMessage;
use App\Models\System\WassenderLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class WassenderLogController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $logs = QueryBuilder::for(WassenderLog::class)
            ->allowedFilters([
                AllowedFilter::exact('template_key'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('whatsapp_group_id'),
            ])
            ->allowedSorts(['created_at', 'sent_at'])
            ->defaultSort('-created_at')
            ->with(['whatsappGroup.linkedStudent', 'whatsappGroup.linkedTeacher.user'])
            ->paginate($request->integer('per_page', 50));

        return WassenderLogResource::collection($logs);
    }

    public function show(WassenderLog $wassenderLog): WassenderLogResource
    {
        $wassenderLog->load(['whatsappGroup.linkedStudent', 'whatsappGroup.linkedTeacher.user']);
        return new WassenderLogResource($wassenderLog);
    }

    public function retry(WassenderLog $wassenderLog): JsonResponse
    {
        if (!in_array($wassenderLog->status, ['failed', 'dead'])) {
            return response()->json(['message' => 'Only failed or dead-lettered messages can be retried.'], 422);
        }

        $wassenderLog->update(['status' => 'queued', 'attempt_count' => 0, 'error' => null]);
        SendWassenderMessage::dispatch($wassenderLog->id)->onQueue('notifications');

        return response()->json(['message' => 'Message re-queued for delivery.']);
    }
}
