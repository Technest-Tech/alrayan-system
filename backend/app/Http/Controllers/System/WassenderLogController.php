<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\WassenderLogResource;
use App\Jobs\System\SendWassenderMessage;
use App\Models\System\WassenderLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class WassenderLogController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $query = QueryBuilder::for(WassenderLog::class)
            ->allowedFilters([
                AllowedFilter::exact('template_key'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('whatsapp_group_id'),
            ])
            ->allowedSorts(['created_at', 'sent_at'])
            ->defaultSort('-created_at')
            ->with(['whatsappGroup.linkedStudent', 'whatsappGroup.linkedTeacher.user']);

        if ($request->filled('from')) {
            $query->where('created_at', '>=', Carbon::parse($request->from)->startOfDay());
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', Carbon::parse($request->to)->endOfDay());
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) =>
                $q->where('recipient_phone', 'like', "%{$search}%")
                  ->orWhere('template_key', 'like', "%{$search}%")
            );
        }

        return WassenderLogResource::collection($query->paginate($request->integer('per_page', 50)));
    }

    public function stats(Request $request): JsonResponse
    {
        $q = WassenderLog::query();

        if ($request->filled('from')) {
            $q->where('created_at', '>=', Carbon::parse($request->from)->startOfDay());
        }
        if ($request->filled('to')) {
            $q->where('created_at', '<=', Carbon::parse($request->to)->endOfDay());
        }

        $counts = (clone $q)->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'sent'    => (int) ($counts['sent']    ?? 0),
            'failed'  => (int) ($counts['failed']  ?? 0),
            'dead'    => (int) ($counts['dead']     ?? 0),
            'queued'  => (int) ($counts['queued']   ?? 0),
            'sending' => (int) ($counts['sending']  ?? 0),
            'total'   => (int) $q->count(),
        ]);
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
